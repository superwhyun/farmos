#!/usr/bin/env python
#
# -*- coding: utf-8 -*-
#
# Copyright (c) 2018 JiNong, Inc.
# All right reserved.
#

import struct
import time
import socket
import select
import traceback
import hashlib
import json
from enum import IntEnum
from threading import Thread, Lock
from mate import Mate, ThreadMate, DevType
from mblock import MBlock, BlkType, StatCode, ResCode, CmdCode, Observation, Request, Response, NotiCode, Notice
from pymodbus.client.sync import ModbusSerialClient
from pymodbus.client.sync import ModbusTcpClient

class NodeType(IntEnum):
    SENNODE = 1
    ACTNODE = 2
    INTNODE = 3
    NUTNODE = 4

class ProtoVer(IntEnum):
    KS_X_3267_2018 = 101
    TTA_1 = 201


class KSX3267Mate(ThreadMate):
    _SLEEP = 0.5
    _VERSION = "KSX3267_0.1"
    _KEYWORDS = {"value" : (2, "float"), "status" : (1, "status"), 
            "opid" : (1, "short"), "state-hold-time" : (2, "int"), "ratio": (1, "short"), 
            "position" : (1, "short"), "remain-time" : (2, "int"),
            "control": (1, "control"), "area" : (1, "short"), "alert" : (1, "alert"), 
            "hold-time" : (2, "int"), "operation" : (1, "operation"),
            "time" : (2, "int"), "opentime" : (1, "short"), "closetime" : (1, "short"),
            "EC": (2, "float"), "pH": (2, "float"), "on-sec" : (1, "short"),
            "start-area" : (1, "short"), "stop-area": (1, "short"), 
            "epoch" : (2, "int"), "vfloat": (2, "float"), "vint" : (2, "int")}

    def __init__(self, option, devinfo, coupleid, logger):
        super(KSX3267Mate, self).__init__(option, devinfo, coupleid, logger)
        self._timeout = 3 if "timeout" not in option else option["timeout"]
        self._conn = None
        self._isdetecting = False
        self._detection = {"saddr":0, "eaddr":0, "opid":0}
        self._nodes = self._devinfo.getgw()["children"]
        self._lock = Lock()
        self._startregister = 40001 if "start" not in option else option["start"]

    def detect_node(self, unit, registers):
        print "detect_node", unit, registers
        compcode = registers[0]
        nodecode = registers[2]
        size = registers[4]

        while True:
            res = self.readregister(self._startregister + 100, size, unit)

            if res.isError():
                self._logger.warn("Fail to get devices from " + str(unit) + " " + str(res))
                return None

            if len(res.registers) != size:
                self._logger.info("retry to get data since size of data is not matched. " + str(size) + " " + str(len(res.registers)))
                continue

            return {"compcode" : compcode, "nodecode" : nodecode, "devcodes": res.registers}

    def detect_nutri(self, unit, registers):
        print "detect_nutri", unit, registers
        compcode = registers[0]
        nodecode = registers[2]
        return {"compcode" : compcode, "nodecode" : nodecode}

    def getdk(self, dev, idx):
        dk = json.loads(dev["dk"])
        return dk[idx]

    def setdetection(self, flag, opid=0):
        self._isdetecting = flag
        self._detection["opid"] = opid

    def startdetection(self, params, opid):
        if self._detection["opid"] != 0:
            return ResCode.FAIL

        self.setdetection(True, opid)
        if params:
            self._detection["saddr"] = params['saddr']
            self._detection["eaddr"] = params['eaddr']
        else:
            self._detection["saddr"] = 1
            self._detection["eaddr"] = 10
        return ResCode.OK

    def readregister(self, addr, count, unit):
        with self._lock:
            time.sleep(KSX3267Mate._SLEEP)
            print "read register", unit, addr, count
            return self._conn.read_holding_registers(addr, count, unit=unit)

    def detect(self):
        detected = {}
        for unit in range(self._detection["saddr"], self._detection["eaddr"]):
            if self._isdetecting == False or self.isexecuting() == False:
                break

            noti = Notice(None, NotiCode.DETECT_NODE_STARTED, devid=unit) # Detection Started
            if noti:
                noti.setkeyvalue("opid", self._detection["opid"])
                self.writecb(noti)

            noti = None
            info = None
            while True:
                res = self.readregister(self._startregister, 6, unit)
                if res.isError():
                    break    

                if len(res.registers) != 6:
                    self._logger.info("retry to get data since size of data is not matched. 6 " + str(len(res.registers)))
                    continue
                break

            if res.isError():
                noti = Notice(None, NotiCode.DETECT_NO_NODE, devid=unit) # Detection Started
                self._logger.info ("Fail to get information from a node : " + str(unit) + " " + str(res))


            elif res.registers[1] in (NodeType.SENNODE, NodeType.ACTNODE, NodeType.INTNODE): # device type
                if res.registers[3] == ProtoVer.KS_X_3267_2018:
                    info = self.detect_node(unit, res.registers)
                    self._logger.info ("Found a node : " + str(unit) + " " + str(info))
                else:
                    noti = Notice(None, NotiCode.DETECT_UNKNOWN_PROTOCOL_VER, devid=unit) # unknown protocol version
            elif res.registers[1] == NodeType.NUTNODE:
                if res.registers[3] == ProtoVer.TTA_1:
                    info = self.detect_nutri(unit, res.registers)
                    self._logger.info ("Found a nutrient system : " + str(unit) + " " + str(info))
                else:
                    noti = Notice(None, NotiCode.DETECT_UNKNOWN_PROTOCOL_VER, devid=unit) # unknown protocol version
            else:
                noti = Notice(unit, NotiCode.DETECT_UNKNOWN_NODE, devid=unit) # unknown device

            if noti is None:
                if info is None:
                    noti = Notice(None, NotiCode.DETECT_WRONG_DEVICE, devid=unit) # fail to find a node
                else:
                    noti = Notice(None, NotiCode.DETECT_NODE_DETECTED, devid=self._option["conn"]["port"][8:], content={unit : info}) # found a node
                    detected[unit] = info

            noti.setkeyvalue("opid", self._detection["opid"])
            print "noti", noti.stringify()
            self.writecb(noti)
            time.sleep(0.1)
    
        self._logger.info ("finished to detect devices : " + str(detected))
        noti = Notice(None, NotiCode.DETECT_FINISHED) # Detection Started
        if noti:
            noti.setkeyvalue("opid", self._detection["opid"])
            noti.setcontent(self._option["conn"]["port"][8:], detected)
#for lid, info in detected.iteritems():
#                noti.setcontent(lid, info)
            self.writecb(noti)
        self.setdetection(False)

    def canceldetection(self, params):
        time.sleep(self._timeout)
        noti = Notice(None, NotiCode.DETECT_CANCELED) # detection is canceled
        noti.setkeyvalue("opid", self._detection["opid"])
        self.setdetection(False)
        self.writecb(noti)
        return ResCode.OK

    def connect(self):
        ret = False

        if self._option['conn']['method'] == 'rtu':
            self._conn =  ModbusSerialClient(method='rtu', port=self._option['conn']['port'],
                    timeout=self._timeout, baudrate=self._option['conn']['baudrate'])
            ret = self._conn.connect()
            msg = "failed to connect with rtu"
            code = NotiCode.RTU_CONNECTED if ret else NotiCode.RTU_FAILED_CONNECTION
        elif self._option['conn']['method'] == 'tcpc':
            self._conn =  ModbusTcpClient(self._option['conn']['host'], port=self._option['conn']['port'], timeout=self._timeout)
            ret = self._conn.connect()
            msg = "failed to connect with tcp"
            code = NotiCode.TCP_CONNECTED if ret else NotiCode.RTU_FAILED_CONNECTION
        else:
            msg = "It's a wrong connection method. " + str(self._option['conn']['method'])

        if ret == False:
            self._logger.warn(msg)
            noti = Notice(None, NotiCode.RTU_FAILED_CONNECTION) # detection is canceled
        else:
            noti = Notice(None, NotiCode.RTU_CONNECTED) # detection is canceled

        self.writecb(noti)
        super(KSX3267Mate, self).connect()
        return ret

    def close(self):
        self._conn.close()
        super(KSX3267Mate, self).close()

    def readmsg(self):
        self._msgq = []
        if self._nodes is None:
            return None

        for nd in self._nodes:
            self._msgq.append(self.readnodeinfo(nd))

        if self._isdetecting:
            self.detect()

    def processrequest(self, dev, request):
        unit = self.getdk(dev, 0)
        operation = request.getcommand()
        params = request.getparams()
        params["operation"] = operation    # need to convert by case
        params["opid"] = request.getopid() # need to convert by case
        properparams = CmdCode.getparams(operation) + ["operation", "opid"]
        registers = []

        for key in self.getdk(dev, 4):
            if key not in properparams:
                # key param is not used for this operation
                # However, the register should be filled.
                val = 0
            elif key in params:
                val = params[key]
            else:
                self._logger.warn("Wrong Keyword : " + str(key))
                return ResCode.FAIL_WRONG_KEYWORD
                    
            if KSX3267Mate._KEYWORDS[key][0] == 1: 
                registers.append(val)
            elif KSX3267Mate._KEYWORDS[key][1] == "int":
                registers.extend(struct.unpack('HH', struct.pack('i', val)))
            elif KSX3267Mate._KEYWORDS[key][1] == "float":
                registers.extend(struct.unpack('HH', struct.pack('f', val)))

            #else:
            #    self._logger.warn("This param is needed for this operation. " + str(params['operation']) + ", " + str(key))
            #    return ResCode.FAIL_WRONG_KEYWORD

        with self._lock:
            time.sleep(1)
            res = self._conn.write_registers(self.getdk(dev, 3), registers, unit=unit)
        if res.isError():
            self._logger.warn("Fail to write a request to dev." + str(dev) + "," + str(res) + ":" + str(request))
            return ResCode.FAIL_TO_WRITE
        return ResCode.OK

    def writeblk(self, blk):
        print "received message", blk.getdevid(), self._coupleid
        if BlkType.isrequest(blk.gettype()) is False:
            self._logger.warn("The message is not request. " + str(blk.gettype()))
            return False

        response = Response(blk)
        cmd = blk.getcommand()
        dev = self._devinfo.finddevbyid(blk.getdevid())

        if blk.getdevid() == self._coupleid:
            params = blk.getparams()
            if cmd == CmdCode.DETECT_DEVICE:
                print "detect device"
                code = self.startdetection(params, blk.getopid())
            elif cmd == CmdCode.CANCEL_DETECT:
                print "cancel to detect device"
                code = self.canceldetection(params)
            else:
                self._logger.warn("Unknown Error. " + str(blk) + ", " + str(dev))
                code = ResCode.FAIL

        elif dev is None:
            self._logger.warn("There is no device. " + str(blk.getdevid()))
            code = ResCode.FAIL_NO_DEVICE

        elif DevType.ispropercommand(dev['dt'], cmd) is False:
            self._logger.warn("The request is not proper. " + str(cmd) + " " + str(dev['dt']))
            code = ResCode.FAIL_NOT_PROPER_COMMAND

        elif DevType.isactuator(dev['dt']) or DevType.isnode(dev['dt']):
            # modbus
            code = self.processrequest(dev, blk)

        elif DevType.isgateway(dev['dt']):
            self._logger.info("Gateway does not receive a request")
            code = ResCode.FAIL

        else:
            self._logger.warn("Unknown Error. " + str(blk) + ", " + str(dev))
            code = ResCode.FAIL

        response.setresult(code)
        self.writecb(response)
        return True if code == ResCode.OK else False

    def parseregisters(self, names, values):
#print "values", values
        idx = 0
        ret = {}
        for nm in names:
            (size, vtype) = KSX3267Mate._KEYWORDS[nm]
#print "idx", vtype, idx, idx+size
            if vtype == "float":
#temp = struct.pack('>H', values[idx+1]) + struct.pack('>H', values[idx])
#print len(temp)
#val = struct.unpack('>f', temp)[0]
                val = struct.unpack('f', struct.pack('HH', values[idx], values[idx+1]))[0]
            elif vtype == "int":
                val = struct.unpack('i', struct.pack('HH', values[idx], values[idx+1]))[0]
            else:
                val = values[idx]
            ret[nm] = val
            idx = idx + size
        print "parsed", ret
        return ret
            
    def readinfofromdev(self, dev):
        size = self.getsize(self.getdk(dev, 2))
#print "read info", dev['dk'], size
        for _ in range(3):
            res = self.readregister(self.getdk(dev, 1), size, self.getdk(dev, 0))

            if res.isError():
                self._logger.info("retry to get status from " + str(dev['dk']) + " " + str(res))
                continue
            else:
                if len(res.registers) == size:
                    return self.parseregisters(self.getdk(dev, 2), res.registers)
                else:
                    self._logger.info("retry to get data since size of data is not matched. " + str(size) + " " + str(len(res.registers)))
        self._logger.warn("fail to get status from " + str(dev['dk']))
        return None

    def readnodeinfo(self, node):    
        ret = {"id" : node["id"], "sen" : {}, "act" : {}}
        info = self.readinfofromdev(node)
        if info:
            ret["nd"] = info
        else:
            self._logger.warn("fail to read node info : " + str(node))
            #return None

        for dev in node['children']:
            info = self.readinfofromdev(dev)
            if info:
                if DevType.issensor(dev["dt"]):
                    ret["sen"][dev["id"]] = info
                else:
                    ret["act"][dev["id"]] = info
            else:
                self._logger.warn("fail to read dev info : " + str(dev) + " however continue to read other device")
        return ret

    def sendobs(self):
        if self._nodes is None:
            return None
        for msg in self._msgq:
            if msg is None:
                continue
            self.sendobservation(msg)

    def sendnoti(self):
        if self._nodes is None:
            return None
        for msg in self._msgq:
            if msg is None:
                continue
            self.sendnoticeforactuatorstatus(msg)

    def sendobservation(self, ndinfo):
        obsblk = Observation(ndinfo["id"])
        obsblk.setobservation(ndinfo["id"], 0, StatCode(ndinfo["nd"]["status"]))
        for devid, info in ndinfo["sen"].iteritems():
            obsblk.setobservation(devid, info["value"], StatCode(info["status"]))
        for devid, info in ndinfo["act"].iteritems():
            obsblk.setobservation(devid, 0, StatCode(info["status"]))

        self.writecb(obsblk)

    def sendnoticeforactuatorstatus(self, ndinfo):
        blk = Notice(ndinfo["id"], NotiCode.ACTUATOR_STATUS, ndinfo["id"], ndinfo["nd"])
        self.writecb(blk)
        for devid, info in ndinfo["act"].iteritems():
            blk = Notice(ndinfo["id"], NotiCode.ACTUATOR_STATUS, devid, info)
            self.writecb(blk)

    def start(self, writecb):
        super(KSX3267Mate, self).start(writecb)
        return True

    def stop(self):
        super(KSX3267Mate, self).stop()
        return True

    def getsize(self, lst):
        size =0
        for k in lst:
            if k in KSX3267Mate._KEYWORDS:
                size = size + KSX3267Mate._KEYWORDS[k][0]
            else:
                self._logger.warn("wrong keyword : " + str(k))
                return -1
        return size

if __name__ == "__main__":
    isnutri = False
    opt = {
        'conn' : {
            'method': 'rtu',
            'port' : '/dev/ttyACM0',
            '_port' : '/dev/ttyUSB0',
            '_baudrate' : 115200,
            'baudrate' : 9600,
            'timeout': 5
        }
    }
    
    nutriinfo = [{
        "id" : "1", "dk" : "", "dt": "gw", "children" : [{
            "id" : "101", "dk" : '[1,40201,["status"],45001,["operation","opid"]]', "dt": "nd", "children" : [
                {"id" : "102", "dk" : '[1,40211,["control","status","area","alert","opid"],45001,["operation", "opid", "control","EC","pH", "start-area", "stop-area", "on-sec"]]', "dt": "nutrient-supply/level1"},
                {"id" : "103", "dk" : '[1,40221,["value","status"]]', "dt": "sen"},
                {"id" : "104", "dk" : '[1,40231,["value","status"]]', "dt": "sen"},
                {"id" : "105", "dk" : '[1,40241,["value","status"]]', "dt": "sen"},
                {"id" : "106", "dk" : '[1,40251,["value","status"]]', "dt": "sen"},
                {"id" : "107", "dk" : '[1,40261,["value","status"]]', "dt": "sen"},
                {"id" : "109", "dk" : '[1,40271,["value","status"]]', "dt": "sen"},
                {"id" : "110", "dk" : '[1,40281,["value","status"]]', "dt": "sen"},
                {"id" : "111", "dk" : '[1,40291,["value","status"]]', "dt": "sen"},
                {"id" : "112", "dk" : '[1,40301,["value","status"]]', "dt": "sen"},
                {"id" : "113", "dk" : '[1,40311,["value","status"]]', "dt": "sen"}
            ]}
        ]}
    ]
    devinfo = [{
        "id" : "1", "dk" : "", "dt": "gw", "children" : [{
            "id" : "101", "dk" : '[1,40201,["status"],45001,["operation","opid"]]', "dt": "nd", "children" : [
#{"id" : "102", "dk" : '[1,41010,["value","status"]]', "dt": "sen"},
#{"id" : "103", "dk" : '[1,41020,["value","status"]]', "dt": "sen"}
                {"id" : "102", "dk" : '[1,40202,["value","status"]]', "dt": "sen"},
                {"id" : "103", "dk" : '[1,40205,["value","status"]]', "dt": "sen"},
                {"id" : "104", "dk" : '[1,40208,["value","status"]]', "dt": "sen"},
                {"id" : "105", "dk" : '[1,40211,["value","status"]]', "dt": "sen"},
                #{"id" : "106", "dk" : '[1,40251,["value","status"]]', "dt": "sen"},
                #{"id" : "107", "dk" : '[1,40261,["value","status"]]', "dt": "sen"},
                #{"id" : "108", "dk" : '[1,40271,["value","status"]]', "dt": "sen"},
                #{"id" : "109", "dk" : '[1,40281,["value","status"]]', "dt": "sen"},
                #{"id" : "110", "dk" : '[1,40291,["value","status"]]', "dt": "sen"}
             ]
        }, {
            "id" : "201", "dk" : '[2,40201,["status"],45001,["operation","opid"]]', "dt": "nd", "children" : [
                {"id" : "202", "dk" : '[2,40202,["opid","status","state-hold-time","remain-time"],40206,["operation","opid","time"]]', "dt": "act/retractable/level1"},
                {"id" : "202", "dk" : '[2,40209,["opid","status","state-hold-time","remain-time"],40213,["operation","opid","time"]]', "dt": "act/retractable/level1"},
                {"id" : "203", "dk" : '[2,40216,["value","status"]]', "dt": "sen"},
                {"id" : "204", "dk" : '[2,40219,["value","status"]]', "dt": "sen"},
                #{"id" : "203", "dk" : (2,40221,["opid","status"],45021,["operation","opid"]), "dt": "act/switch/level0"},
                #{"id" : "204", "dk" : (2,40231,["opid","status"],45031,["operation","opid"]), "dt": "act/switch/level0"},
                #{"id" : "205", "dk" : (2,40241,["opid","status"],45041,["operation","opid"]), "dt": "act/switch/level0"},
                #{"id" : "206", "dk" : (2,40251,["opid","status"],45051,["operation","opid"]), "dt": "act/switch/level0"},
                #{"id" : "207", "dk" : (2,40261,["opid","status"],45061,["operation","opid"]), "dt": "act/switch/level0"},
                #{"id" : "208", "dk" : (2,40271,["opid","status"],45071,["operation","opid"]), "dt": "act/switch/level0"},
                #{"id" : "209", "dk" : (2,40281,["opid","status"],45081,["operation","opid"]), "dt": "act/switch/level0"}
             ]
        }]
    }]
    """
        }, {
            "id" : "301", "dk" : (3,40201,["opid","status"],45001,["operation","opid"]), "dt": "nd", "children" : [
                {"id" : "302", "dk" : (3,40211,["opid","status"],45011,["operation","opid"]), "dt": "act/retractable/level0"},
                {"id" : "303", "dk" : (3,40221,["opid","status"],45021,["operation","opid"]), "dt": "act/retractable/level0"},
                {"id" : "304", "dk" : (3,40231,["opid","status"],45031,["operation","opid"]), "dt": "act/retractable/level0"},
                {"id" : "305", "dk" : (3,40241,["opid","status"],45041,["operation","opid"]), "dt": "act/retractable/level0"}
            ]
        }]
    }]
    """

    if isnutri:
        kdmate = KSX3267Mate(opt, nutriinfo, "1", None)
    else:
        kdmate = KSX3267Mate(opt, devinfo, "1", None)

    mate = Mate ({}, [], "1", None)
    kdmate.start (mate.writeblk)
    print "mate started"

    time.sleep(10)
    req = Request(None)
    req.setcommand("1", CmdCode.DETECT_DEVICE, {'saddr':1, 'eaddr':3})
    kdmate.writeblk(req)

    time.sleep(10)
    req = Request(201)
    req.setcommand(202, CmdCode.OPEN, {})
    kdmate.writeblk(req)

    time.sleep(5)
    req = Request(201)
    req.setcommand(202, CmdCode.OFF, {})
    kdmate.writeblk(req)
    
    time.sleep(10)
    req = Request(201)
    req.setcommand(202, CmdCode.TIMED_OPEN, {"time":10})
    kdmate.writeblk(req)

    time.sleep(15)
    req = Request(201)
    req.setcommand(202, CmdCode.TIMED_CLOSE, {"time":10})
    kdmate.writeblk(req)

    time.sleep(5)
    req = Request(201)
    req.setcommand(202, CmdCode.OFF, {})
    kdmate.writeblk(req)
    
    """
    """

    time.sleep(15)
    kdmate.stop()
    print "mate stopped" 
