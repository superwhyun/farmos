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

from mate import Mate
from mblock import MBlock, BlkType, ResCode, StatCode, Request, Observation, NotiCode 
from jnmqtt import JNMQTT
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

class JNMQTTMate(Mate):

    def __init__(self, option, devinfo, coupleid, logger):
        self._jnmqtt = JNMQTT(option, DevInfo(devinfo), logger)
        super(JNMQTTMate, self).__init__(option, devinfo, coupleid, logger)

    def connect(self):
        self._jnmqtt.connect(True)
        super(JNMQTTMate, self).connect()
        return True

    def close(self):
        self._jnmqtt.close()
        super(JNMQTTMate, self).close()

    def start(self, writecb):
        self._jnmqtt.start(self.onmsg)
        super(JNMQTTMate, self).start(writecb)
        self.connect()

    def stop(self):
        self._jnmqtt.stop()
        super(JNMQTTMate, self).stop()
        self.close()

    def writeblk(self, blk):
        self._jnmqtt.writeblk(blk)

    def onmsg(self, client, obj, blk):
        print("JNMQTTMate Received mblock '" + str(blk.payload) + "' on topic '"
              + blk.topic + "' with QoS " + str(blk.qos))

        msg = self._jnmqtt.getpropermsg(blk)
        if msg is None:
            self._logger.warn("The message is not proper " + str(blk))
            return None

#        try:
        tmp = blk.topic.split('/')

        if JNMQTT._SVR == tmp[2] and JNMQTT._STAT == tmp[3]:
            if blk.payload == _STAT_ON:
                self._logger.info("The server is OK now.")
            else:
                self._logger.warn("The server might have some problems.")

        if BlkType.isrequest(msg.gettype()):
            ret = self.writecb(msg)
        else:
            self._logger.warn("Wrong message : " + blk.payload)
#        except Exception as ex:
#            self._logger.warn("fail to call onmsg : " + str(ex) + " "  + blk.payload)

if __name__ == "__main__":
    option = {
        "conn" : {"host" : "dev.jinong.co.kr", "port" : 1883, "keepalive" : 60},
        "mqtt" : {"svc" : "cvtgate", "id" : "1"},
        "area" : "local"
    }

    devinfo = [
        {"id" : "0", "dk" : "0", "dt": "gw", "children" : [
            {"id" : "1", "dk" : "1", "dt": "nd", "children" : [
                {"id" : "11", "dk" : "11", "dt": "sen"},
                {"id" : "12", "dk" : "12", "dt": "act"}
            ]}
        ]}
    ]

    mqttc = JNMQTTMate(option, devinfo, None)
    mate = Mate({}, [], None)
    mqttc.start(mate.writeblk)

    cmd = Request(1, None)
    cmd.setcommand(12, 'on', {})

    publish.single("cvtgate/1/req/1", cmd.stringify(), hostname="dev.jinong.co.kr")
    print "published"

    time.sleep(5)
    mqttc.stop()

    print "local tested."
