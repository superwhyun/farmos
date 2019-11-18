#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2018 JiNong, Inc.
# All right reserved.
#

import sys
import time
import json
import struct
import binascii
import datetime
import importlib
from mate import Mate, ThreadMate, DevType
from mblock import MBlock, BlkType, StatCode, Observation, NotiCode, Notice
from dinfo import DevInfo
#from connection import SerialConnection

sys.path.insert(0, '../cdtp/cdtpy')
import cdtp

'''
option : {
    "conn" : {
        "mod" : "connection",
        "class" : "SerialConnection",
        "port" : "/dev/ttyUSB0",
        "baudrate" : 9600,
        "BBB" : True
    },
    "gatewaykey" : "KI-01"
}

children: [
    {"id" : "3", "dk" : "1", "dt" : "nd", "children" : [
        {"id" : "4", "dk" : "4", "dt" : "sen"},
        {"id" : "5", "dk" : "5", "dt" : "sen"},
        {"id" : "6", "dk" : "6", "dt" : "sen"}
    ]}
]

'''

class CDTPMate(ThreadMate):
    def __init__(self, option, devinfo, coupleid, logger):
        super(CDTPMate, self).__init__(option, devinfo, coupleid, logger):
        self._cdtp = cdtp.CDTPServer(option["gatewaykey"])
        self._conn = self.loadconnection(option["conn"], logger)
        self._lastlog = {}

    def loadconnection(self, option, logger):
        module = importlib.import_module(option['mod'])
        class_ = getattr(module, option['class'])
        conn = class_(option, logger)
        return conn

    def start(self, writecb):
        self._conn.open()
        return super(CDTPMate, self).start(writecb)

    def stop(self):
        super(CDTPMate, self).stop()
        print "CDTPMate stopped."
        self._conn.close()

    def wrapblk(self, noti):
        try:
            node = self._devinfo.finddev(noti["SNID"], DevType.NODE)
            obsblk = Observation(node["id"])
            for k, v in noti["observations"].iteritems():
                sid = self._devinfo.findid(k, DevType.SENSOR, node['children'])
                if sid is None:
                    self._logger.warn("fail to find id. " + str(k))
                    continue
                obsblk.setobservation(sid, [self.getvalue(k, v), StatCode.READY])
            return [obsblk]
        except Exception as ex:
            self._logger.warn("fail to wrap. " + str(ex))
            return None

    def send(self, snid, msg):
        if self._option["conn"]["binary"]:
            buf = msg
        else:
            buf = ''.join(format(x, '02x') for x in msg)
            self._logger.info("send " + buf)
        self._conn.write(buf)

    def readmsg(self):
        #try:
        if self._option["conn"]["binary"]:
            buf = self._conn.read(cdtp.CDTP_MSGLEN)
            self._logger.info("buf: " + buf)
        else:
            binbuf = self._conn.read(cdtp.CDTP_BINMSGLEN * 2)
            self._logger.info("buf: " + binbuf)
            buf = binascii.unhexlify(binbuf)

        parsed = self._cdtp.parse(buf)
        if parsed:
            print "parsed", parsed
            if parsed['type'] == 'Notification':
                snid = parsed["values"]["SNID"]
                if snid in self._lastlog:
                    return self.wrapblk(parsed["values"])
                else:
                    self._logger.info("Message from a not registered device." + str(snid))
                    self._logger.info("Start to reconfigure.")
                    req = self._cdtp.reconfigure(snid, self._option['gatewaykey'], None, 60)
                    self.send(snid, req)
                    return None
            elif parsed['type'] == 'Request':
                if parsed["values"]["gatewaykey"] != self._option['gatewaykey']:
                    self._logger.info("Received from unknown gateway. Skip this request." + str(parsed["values"]["gatewaykey"]))
                    return None
                res = self._cdtp.response(parsed, cdtp.CDTP_OK)
                snid = parsed["values"]["SNID"]
                self._lastlog[snid] = datetime.datetime.now()
                self.send(snid, res)
                
                blk = Notice(self._devinfo.findid(snid, DevType.NODE), NotiCode.NODE_CONNECTED)
                return [blk]
            else:
                print "weired mblock.", parsed
        else:
            print "wrong mblock.", buf
        return None
        #except Exception as ex:
        #    print "fail to read blk", ex
        #    return None

if __name__ == "__main__":
    option = {
        "conn": {
            "mod": "connection",
            "class": "ETXSerialConnection",
            "port": "/dev/ttyUSB0",
            "baudrate": 9600,
            "ETX": "$",
            "binary": False,
            "BBB": False
        },
        "calibration": {
            "1": {"type": "linear", "args": {"a": 0.1, "b": -100}},
            "2": {"type": "linear", "args": {"a": 0.1, "b": -100}},
            "3": {"type": "case", "args": [[300, 400, 90], [600, 800, 135], [900, 1200, 180], [1500, 1900, 45], [2100, 2600, 225], [2600, 3200, 0], [3000, 3600, 315], [3200, 3800, 270]]},
            "4": {"type": "linear", "args": {"a": 0.0125, "b": 0.2}},
            "5": {"type": "linear", "args": {"a": 0.66072, "b": 0}},
            "7": {"type": "linear", "args": {"a": 0.2794, "b": 0}}
        },
        "gatewaykey": "KI-01"
    }

    devinfo = [
        {"id" : "1", "dk" : "KI-01", "dt" : "gw", "children" : [
            {"id" : "2", "dk" : "1", "dt" : "nd", "children" : [
                {"id" : "3", "dk" : "1", "dt" : "sen"},
                {"id" : "4", "dk" : "2", "dt" : "sen"},
                {"id" : "5", "dk" : "3", "dt" : "sen"},
                {"id" : "6", "dk" : "4", "dt" : "sen"},
                {"id" : "7", "dk" : "5", "dt" : "sen"},
                {"id" : "8", "dk" : "7", "dt" : "sen"}
            ]}
        ]}
    ]

    mate = CDTPMate(option, devinfo, None)
    mate2 = Mate({}, [], None)
    mate.start(mate2.writeblk)
    print "mate started"
    time.sleep(10)
    mate.stop()
    print "mate stopped"
