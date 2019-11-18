#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2018 JiNong, Inc.
# All right reserved.
#

import json
import sys
import time
import datetime
import paho.mqtt.client as mqtt
import paho.mqtt.publish as publish
from threading import Lock
from mate import Mate
from mblock import MBlock, BlkType, ResCode, StatCode, Request, Observation, NotiCode 
from dinfo import DevInfo

'''
option : {
    "conn" : {"host" : "dev.jinong.co.kr", "port" : 1883, "keepalive" : 60},
    "mqtt" : {"svc" : "cvtgate", "id" : "1"},
    "area" : "local"
}

devinfo : [
    {"id" : "2", "dk" : "1", "dt": "gw", "children" : [
      {"id" : "3", "dk" : "1", "dt": "nd", "children" : [
        {"id" : "4", "dk" : "0", "dt": "sen"},
        {"id" : "5", "dk" : "1", "dt": "act"}
      ]}
    ]}
]
'''

class JNMQTT:
    _REQ = "req"
    _RES = "res"
    _OBS = "obs"
    _NOTI = "noti"
    _SELF = "self"
    _SVR = "svr"
    _STAT = "stat"

    _STAT_ON = "on"
    _STAT_OFF = "off"

    def __init__(self, option, devinfo, logger):
        self._client = None
        self._option = option
        self._devinfo = devinfo
        self._logger = logger
        self._lock = Lock()
        assert self._devinfo.isok(), "Device Information is not ok."
#self._topic = self._option["mqtt"]["svc"] + "/" + self._devinfo[0]["id"]
        self._svc = self._option["mqtt"]["svc"] + "/" + self._option["mqtt"]["id"]
        self._ischecksvr = False
        self._isexecuting = False

    def start(self, onmsgcb):
        self._isexecuting = True
        self._client = mqtt.Client()
        self._client.loop(.1)
        if onmsgcb:
            self._client.on_message = onmsgcb
        else:
            self._client.on_message = self.onmsg
        self._client.on_socket_close = self.onclose
        self._client.on_disconnect = self.onclose

    def connect(self, ischecksvr):
        conn = self._option["conn"]
        self._ischecksvr = ischecksvr

        self._client.will_set("/".join([self._svc, JNMQTT._SELF, JNMQTT._STAT]), JNMQTT._STAT_OFF, 0, False)
        self._client.connect(conn["host"], conn["port"], conn["keepalive"])

        self._client.publish("/".join([self._svc, JNMQTT._SELF, JNMQTT._STAT]), JNMQTT._STAT_ON)

        self._client.subscribe("/".join([self._svc, JNMQTT._SELF, JNMQTT._REQ]), 2) # qos = 2
        if ischecksvr:
            self._client.subscribe("/".join([self._svc, JNMQTT._SVR, JNMQTT._STAT]), 2) # qos = 2

        self.nodesubscribe(JNMQTT._REQ, 2)

        self._client.loop_start()

    def close(self):
        pass

    def stop(self):
        with self._lock:
            self._isexecuting = False
            self._client.publish("/".join([self._svc, JNMQTT._SELF, JNMQTT._STAT]), JNMQTT._STAT_OFF)
            self._client.loop_stop()

    def writeblk(self, blk):
        print "**jnmqtt writeblk", blk.stringify()
        value = blk.stringify()
        inter = JNMQTT._SELF if blk.getnodeid() is None else ""
        node = "" if blk.getnodeid() is None else str(blk.getnodeid())

        if blk.getnodeid() is None:
            gwid = blk.getextra("gwid")
            if gwid is None:
                idx = 2
                lst = [self._svc, JNMQTT._SELF, ""]
            else:
                idx = 3
                lst = [self._svc, str(gwid), JNMQTT._SELF, ""]
        else:
            idx = 2
            gwid = self._devinfo.findgateway(blk.getnodeid())["id"]
            lst = [self._svc, str(gwid), "", str(blk.getnodeid())]

        if BlkType.isobservation(blk.gettype()):
            lst[idx] = JNMQTT._OBS
            qos = 0
        elif BlkType.isnotice(blk.gettype()):
            lst[idx] = JNMQTT._NOTI
            qos = 1
        elif BlkType.isrequest(blk.gettype()):
            lst[idx] = JNMQTT._REQ
            qos = 2
        elif BlkType.isresponse(blk.gettype()):
            lst[idx] = JNMQTT._RES
            qos = 2
        else:
            # error log
            return False
        with self._lock:
            #ret = self._client.publish("/".join(lst), value, qos)
            ret = publish.single("/".join(lst), payload=value, qos=qos, hostname=self._option["conn"]["host"])
            print "publish : ", "/".join(lst), ret, qos, value

    def nodesubscribe(self, tstr, qos):
        lst = [self._svc, "", tstr, ""]
        for root in self._devinfo:
            assert root["dt"] == "gw" and "children" in root and "id" in root
            lst[1] = root["id"]
            for nd in root['children']:
                lst[3] = nd["id"]
                with self._lock:
                    self._client.subscribe("/".join(lst), qos) # qos = 2

    def getpropermsg(self, blk):
        tmp = blk.topic.split('/')
        msg = MBlock.load(blk.payload)
        if msg is None:
            self._logger.info("Fail to parse a message. " + str(blk.payload))
            return msg
            
        if tmp[3] == JNMQTT._REQ and BlkType.isrequest(msg.gettype()):
            return msg
        if tmp[3] == JNMQTT._RES and BlkType.isresponse(msg.gettype()):
            return msg
        if tmp[3] == JNMQTT._NOTI and BlkType.isnotice(msg.gettype()):
            return msg
        if tmp[3] == JNMQTT._OBS and BlkType.isobservation(msg.gettype()):
            return msg

        self._logger.info("Topic is not matched. Check [3]. " + str(tmp))
        return None

    def onmsg(self, client, obj, blk):
        self._logger.info("Received mblock '" + str(blk.payload) + "' on topic '"
              + blk.topic + "' with QoS " + str(blk.qos))
        try:
            tmp = blk.topic.split('/')

            if JNMQTT._SVR == tmp[2] and JNMQTT._STAT == tmp[3]:
                if blk.payload == JNMQTT._STAT_ON:
                    self._logger.info("The server is OK now.")
                else:
                    self._logger.warn("The server might have some problems.")

            msg = self.getpropermsg(blk)
            if msg:
                self._logger.info("proper message : " + blk.payload)
            else:
                self._logger.warn("wrong message!!")
        except Exception as ex:
            self._logger.warn("fail to call onmsg: " + str(ex) + " "  + blk.payload)

    def onclose(self, client, udata, sock):
        self._logger.warn("Disconnected with mqtt server.")
        if self._isexecuting:
            self.connect(self._ischecksvr)

if __name__ == "__main__":
    option = {
        "conn" : {"host" : "dev.jinong.co.kr", "port" : 1883, "keepalive" : 60},
        "mqtt" : {"svc" : "cvtgate"},
    }

    devinfo = [
        {"id" : "1", "dk" : "0", "dt": "gw", "children" : [
            {"id" : "10", "dk" : "1", "dt": "nd", "children" : [
                {"id" : "11", "dk" : "11", "dt": "sen"},
                {"id" : "12", "dk" : "12", "dt": "act"}
            ]}
        ]}
    ]

    mqttc = JNMQTT(option, devinfo, None)
    mate = Mate({}, [], None)
    mqttc.start(mate.writeblk)

    cmd = Request(1, None)
    cmd.setcommand(12, 'on', {})

    publish.single("cvtgate/1/req/10", cmd.stringify(), hostname="dev.jinong.co.kr")
    print "published"

    time.sleep(5)
    mqttc.stop()

    print "tested."
