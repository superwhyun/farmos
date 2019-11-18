#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2019 JiNong, Inc.
# All right reserved.
#
# mate for interaction with farmos 

import json
import sys
import time
import datetime
import pymysql
import logging
from threading import Lock
from mate import Mate, ThreadMate, DevType
from mblock import MBlock, BlkType, StatCode, ResCode, CmdCode, Observation, Request, Response, NotiCode, Notice

'''
option : {
    "conn" : {"host" : "localhost", "user" : "root",
              "password" : "pass", "db" : "db"}
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

class FarmosDB:
    _CUROBS_QUERY = "update current_observations set obs_time = %s, nvalue = %s where data_id = %s"
    _OBS_QUERY = "insert observations(obs_time, nvalue, data_id) values(%s, %s, %s)"
    _REQINS_QUERY = "insert requests(opid, device_id, command, params) values(%s, %s, %s, %s)"
    _REQUPS_QUERY = "update requests set status = %s, exectime = now() where opid = %s "
    _REQFIN_QUERY = "update requests set finishtime = now() where device_id = %s and opid = %s "
    _CODESET = {
        "status" : 0, 
        "value" : 1,
        "position" : 2, 
        "state-hold-time" : 3,
        "remain-time": 4,
        "ratio" : 5,
        "control" : 6,
        "area" : 7,
        "alert" : 8
    }

    def __init__(self, option, devinfo, logger):
        self._lock = Lock()
        self._conn = None
        self._cur = None
        self._option = option
        self._devinfo = devinfo
        self._logger = logging.getLogger('farmos') if logger is None else logger
        self._lastopid = {}

    def start(self):
        pass

    def connect(self):
        copt = self._option["db"]
        self._conn = pymysql.connect(host=copt["host"], user=copt["user"],
                                     password=copt["password"], db=copt["db"])
        self._cur = self._conn.cursor()

    def close(self):
        self._cur.close()
        self._conn.close()

    def stop(self):
        pass

    def readmsg(self):
        pass

    def _writedata(self, time, nvalue, dataid):
        params = [time, nvalue, dataid]
        print FarmosDB._CUROBS_QUERY, params
        with self._lock:
            try:
                self._cur.execute(FarmosDB._CUROBS_QUERY, params)
                self._cur.execute(FarmosDB._OBS_QUERY, params)
                self._conn.commit()
            except Exception as ex:
                self._logger.warn("DB exception : " + str(ex))
                try:
                    self.close()
                    self.connect()
                except Exception as ex:
                    self._logger.warn("DB exception : " + str(ex))


    def getdataid(self, devid, code):
        if code in FarmosDB._CODESET:
            return 10000000 + int(devid) * 100 + int(FarmosDB._CODESET[code])

    def checkdata(self, dataid, value, status):
        if status == StatCode.READY:
            pass # should check
            #self._logger.warn("Abnormal data : " + str(value))
            return status # should return new status
        return status

    def writeobs(self, blk):
        content = blk.getcontent()
        tm = content.pop('time', None)
        for devid, values in blk.getcontent().iteritems():
            dev = self._devinfo.finddevbyid(devid)
            if dev is None:
                self._logger.warn("There is no device : " + str(devid))
                continue 

            if DevType.issensor(dev["dt"]):
                vdid = self.getdataid(devid, "value")
                status = self.checkdata(vdid, values[0], values[1])
                if status == StatCode.READY:
                    self._writedata(tm, values[0], vdid)
                self._writedata(tm, status, self.getdataid(devid, "status"))

            # Notification is enough for actuators
            #elif DevType.isactuator(dev["dt"]):
            #    self._writedata(tm, values[1], self.getdataid(devid, "status"))

    def writenoti(self, blk):
        content = blk.getcontent()
        tm = content.pop("time")
        code = content.pop("code")
        if code == NotiCode.ACTUATOR_STATUS: # Actuator Status
            for devid, noti in content.iteritems():
                did = int(devid)
                if did in self._lastopid and "status" in noti:
                    print "lastopid ready", self._lastopid[did], noti["status"]
                    if noti["status"] == 0:
                        print FarmosDB._REQFIN_QUERY, [devid, self._lastopid[did]]
                        self._cur.execute(FarmosDB._REQFIN_QUERY, [devid, self._lastopid[did]])
                        del self._lastopid[did]

                for key, value in noti.iteritems():
                    did = self.getdataid(devid, key)
                    if did:
                        self._writedata(tm, value, did)

        elif code >= NotiCode.DETECT_NODE_STARTED and code < NotiCode.ACTUATOR_STATUS: # device detection
            pass
        else: # Just Notification
            pass

    def writeblk(self, blk):
        print "farmosdb writeblk", blk.getcontent()
        if BlkType.isobservation(blk.gettype()):
            print "write obs"
            self.writeobs(blk)

        elif BlkType.isrequest(blk.gettype()):
            print "write req"
            content = blk.getcontent()
            if content["cmd"] >= CmdCode.DETECT_DEVICE:
                print "detect device"
            else:
                if "param" not in content:
                    self._logger.warn("Request needs 'param' " + blk.stringify())
                    return False
                
                params = [content["opid"], content["id"], content["cmd"], json.dumps(content["param"])]
                print "insert req", FarmosDB._REQINS_QUERY, params
                with self._lock:
                    try:
                        did = int(content["id"])
                        if did in self._lastopid:
                            print FarmosDB._REQFIN_QUERY, [did, self._lastopid[did]]
                            self._cur.execute(FarmosDB._REQFIN_QUERY, [did, self._lastopid[did]])
                            del self._lastopid[did]

                        self._lastopid[did] = content["opid"]
                        self._cur.execute(FarmosDB._REQINS_QUERY, params)
                        self._conn.commit()
                    except Exception as ex:
                        self._logger.warn("DB exception : " + str(ex))
                        self.close()
                        self.connect()

        elif BlkType.isresponse(blk.gettype()):
            print "write res"
            content = blk.getcontent()
            uquery = "update requests set status = %s, exectime = now() where opid = %s "
            params = [content["res"], content["opid"]]
            self._lastopid[int(content["id"])] = {content["opid"]}
            print FarmosDB._REQUPS_QUERY, params
            with self._lock:
                try:
                    self._cur.execute(FarmosDB._REQUPS_QUERY, params)
                    self._conn.commit()
                except Exception as ex:
                    self._logger.warn("DB exception : " + str(ex))
                    self.close()
                    self.connect()

        elif BlkType.isnotice(blk.gettype()):
            print "write noti"
            self.writenoti(blk)

        else:
            # error log
            self._logger.warn("wrong type messsage : " + blk.stringify())
            return False

        print "finish writing block."
        print "finish writing block."
        print "finish writing block."

        return True

if __name__ == "__main__":
    option = {"conn" : {"host" : "localhost", "user" : "root", "password" : "pass", "db" : "db"}}
    devinfo = [{"id" : "2", "dk" : "1", "dt": "gw", "children" : [ 
      {"id" : "3", "dk" : "1", "dt": "nd", "children" : [
        {"id" : "4", "dk" : "0", "dt": "sen"},
        {"id" : "5", "dk" : "1", "dt": "act"}
      ]}
    ]}]
    rrw = FarmosDB(option, devinfo, None)
    mate = Mate({}, [], None)
    rrw.start(mate.writeblk)

    time.sleep(3)
    rrw.stop()
