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


class KSX3267MateV2(ThreadMate):
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
    _DEVINFOREG = 2
    _DEVCODEREG = 101

    def __init__(self, option, devinfo, coupleid, logger):
        super(KSX3267MateV2, self).__init__(option, devinfo, coupleid, logger)
        self._timeout = 3 if "timeout" not in option else option["timeout"]
        self._conn = {}
        self._tempthd = []
        self._isdetecting = False
        self._detection = {"port": [], "saddr":0, "eaddr":0, "opid":0}
        #self._nodes = self._devinfo.getgw()["children"]
        self._lock = Lock()
        self._logger.info("KSX3267MateV2 Started.")

    def detect_node(self, conn, unit, registers):
        print "detect_node", unit, registers
        compcode = registers[0]
        nodecode = registers[2]
        size = registers[4]

        while True:
            res = self.readregister(conn, KSX3267MateV2._DEVCODEREG, size, unit)

            if res is None or res.isError():
                self._logger.warn("Fail to get devices from " + str(unit) + " " + str(res))
                return None

            if len(res.registers) != size:
                self._logger.info("retry to get data since size of data is not matched. " + str(size) + " " + str(len(res.registers)))
                continue

            return {"compcode" : compcode, "nodecode" : nodecode, "devcodes": res.registers}

    def getdk(self, dev, idx):
        dk = json.loads(dev["dk"])
        return dk[idx]

    def setdetection(self, flag, opid=0):
        self._isdetecting = flag
        self._detection["opid"] = opid

    def startdetection(self, params, opid):
        if self._detection["opid"] != 0:
            self._logger.info("detection is processing.... so this command would be ignored.")
            return ResCode.FAIL

        self.setdetection(True, opid)
        if params:
            self._detection["saddr"] = params['saddr']
            self._detection["eaddr"] = params['eaddr']
            self._detection["port"] = params['port']
        else:
            self._detection["saddr"] = 1
            self._detection["eaddr"] = 5
            self._detection["port"] = None
        return ResCode.OK

    def readregister(self, conn, addr, count, unit):
        print "....... before lock for read"
        with self._lock:
            time.sleep(KSX3267MateV2._SLEEP)
            print "read register", unit, addr, count
            try:
                return conn.read_holding_registers(addr, count, unit=unit)
            except Exception as ex:
                self._logger.warn("fail to read holding registers. : " + str(ex))
                return None

    def detect(self):
        detected = {}
        for port, conn in self._conn.iteritems():
            if self._isdetecting == False or self.isexecuting() == False:
                self._logger.info("Total detection is canceled.")
                break
            info = self.detectone(port, conn)
            detected[port] = info

        self._logger.info ("finished to detect devices : " + str(detected))
        noti = Notice(None, NotiCode.DETECT_FINISHED) # Detection Started
        if noti:
            noti.setkeyvalue("opid", self._detection["opid"])
            for port, info in detected.iteritems():
                noti.setcontent(port, info)
            self.writecb(noti)
        self.setdetection(False)

    def detectone(self, port, conn):
        detected = {}
        if self._detection["port"] is not None and port not in self._detection["port"]:
            return detected

        for unit in range(self._detection["saddr"], self._detection["eaddr"]):
            if self._isdetecting == False or self.isexecuting() == False:
                self._logger.info("A port " + str(port) + " detection is canceled.")
                break

            tempid = port + "-" + str(unit)
            noti = Notice(None, NotiCode.DETECT_NODE_STARTED, devid=tempid) # Detection Started
            if noti:
                noti.setkeyvalue("opid", self._detection["opid"])
                self.writecb(noti)

            noti = None
            info = None
            res = None
            for _ in range(3):
                res = self.readregister(conn, KSX3267MateV2._DEVINFOREG, 6, unit)
                if res is None or res.isError():
                    continue

                if len(res.registers) != 6:
                    self._logger.info("retry to get data since size of data is not matched. 6 " + str(len(res.registers)))
                    continue
                break

            if res is None or res.isError():
                noti = Notice(None, NotiCode.DETECT_NO_NODE, devid=tempid) # Detection Started
                self._logger.info ("Fail to get information from a node : " + str(unit) + " " + str(res))


            elif res.registers[1] in (NodeType.SENNODE, NodeType.ACTNODE, NodeType.INTNODE): # device type
                if res.registers[3] == ProtoVer.KS_X_3267_2018:
                    info = self.detect_node(conn, unit, res.registers)
                    self._logger.info ("Found a node : " + str(unit) + " " + str(info))
                else:
                    noti = Notice(None, NotiCode.DETECT_UNKNOWN_PROTOCOL_VER, devid=tempid) # unknown protocol version
            elif res.registers[1] == NodeType.NUTNODE:
                if res.registers[3] == ProtoVer.TTA_1:
                    info = self.detect_node(conn, unit, res.registers)
                    self._logger.info ("Found a nutrient system : " + str(unit) + " " + str(info))
                else:
                    noti = Notice(None, NotiCode.DETECT_UNKNOWN_PROTOCOL_VER, devid=tempid) # unknown protocol version
            else:
                noti = Notice(unit, NotiCode.DETECT_UNKNOWN_NODE, devid=tempid) # unknown device

            if noti is None:
                if info is None:
                    noti = Notice(None, NotiCode.DETECT_WRONG_DEVICE, devid=tempid) # fail to find a node
                else:
                    noti = Notice(None, NotiCode.DETECT_NODE_DETECTED, devid=port, content={unit : info}) # found a node
                    detected[unit] = info

            noti.setkeyvalue("opid", self._detection["opid"])
            print "noti", noti.stringify()
            self.writecb(noti)
            time.sleep(0.1)
    
        return detected

    def canceldetection(self, params):
        time.sleep(self._timeout)
        noti = Notice(None, NotiCode.DETECT_CANCELED) # detection is canceled
        noti.setkeyvalue("opid", self._detection["opid"])
        self.writecb(noti)
        self.setdetection(False)
        return ResCode.OK

    def _listen(self, opt):
        try:
            servsoc = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            servsoc.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            servsoc.bind((opt['host'], opt['port']))
            servsoc.listen(1)
            self._logger.info("listen : " + str(opt))

            executing = True
            while executing:
                self._logger.info("waiting a client~")
                rsoc, wsoc, esoc = select.select([servsoc], [], [], 10)
                for sock in rsoc:
                    if sock == servsoc:
                        clisoc, address = servsoc.accept()
                        self._logger.info("client connected from " + str(address))
                        for tmp in self._tempthd:
                            if tmp["port"] == opt["port"]:
                                conn = ModbusTcpClient(timeout=self._timeout)
                                conn.socket = clisoc
                                self._conn[opt["port"]] = conn
                                tmp["status"] = 10 # connected
                                executing = False

        except Exception as ex:
            servsoc.close()
            for tmp in self._tempthd:
                if tmp["port"] == opt["port"]:
                    self._logger.warn(" port [" + str(opt["port"]) + "] exception : " + str(ex))
                    tmp["status"] = 5 # error

    def listen(self, opt):
        tmp = {"thd" : Thread(target=self._listen, args=(opt)), "status": 0, "port":opt['port']}
        self._tempthd.append(tmp)
        tmp["thd"].start()

    def checktempthreads(self):
        for tmp in self._tempthd:
            if tmp["status"] > 2:
                tmp["thd"].stop()
                tmp["thd"].join()

    def connectone(self, opt):
        ret = False
        conn = None

        if opt['method'] == 'rtu':
            conn =  ModbusSerialClient(method='rtu', port=opt['port'],
                    timeout=self._timeout, baudrate=opt['baudrate'])
            ret = conn.connect()
            msg = "failed to connect with rtu"
            code = NotiCode.RTU_CONNECTED if ret else NotiCode.RTU_FAILED_CONNECTION
        elif opt['method'] == 'tcpc':
            conn =  ModbusTcpClient(opt['host'], port=opt['port'], timeout=self._timeout)
            ret = conn.connect()
            msg = "failed to connect with tcp"
            code = NotiCode.TCP_CONNECTED if ret else NotiCode.RTU_FAILED_CONNECTION
        elif opt['method'] == 'tcpcs':
            self._logger.info("It would wait for a while to connect a client.")
            ret = self.listen(opt)
            msg = "failed to connect with tcp"
            code = NotiCode.TCP_WAITING if ret else NotiCode.RTU_FAILED_CONNECTION
            conn = None
        else:
            msg = "It's a wrong connection method. " + str(opt['method'])

        if ret == False:
            self._logger.warn(msg)
            noti = Notice(None, NotiCode.RTU_FAILED_CONNECTION) # detection is canceled
        else:
            noti = Notice(None, NotiCode.RTU_CONNECTED) # detection is canceled

        self.writecb(noti)
        return conn

    def connect(self):
        ret = False
        for opt in self._option['conn']:
            conn = self.connectone(opt)
            if conn:
                self._conn[opt["port"][8:]] = conn

        super(KSX3267MateV2, self).connect()
        return ret

    def closeone(self, port):
        self._conn[port].close()

    def close(self):
        for port in self._conn.keys():
            self.closeone(port)
        super(KSX3267MateV2, self).close()

    def readmsg(self):
        self._msgq = []

        for gw in self._devinfo:
            for nd in gw["children"]:
                self._msgq.append(self.readsensornodeinfo(nd))

        if self._isdetecting:
            self.detect()

        self.checktempthreads()

    def processrequest(self, dev, request, node):
        gw = self._devinfo.findgateway(request.getnodeid())
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
                    
            if KSX3267MateV2._KEYWORDS[key][0] == 1: 
                registers.append(val)
            elif KSX3267MateV2._KEYWORDS[key][1] == "int":
                registers.extend(struct.unpack('HH', struct.pack('i', val)))
            elif KSX3267MateV2._KEYWORDS[key][1] == "float":
                registers.extend(struct.unpack('HH', struct.pack('f', val)))

            #else:
            #    self._logger.warn("This param is needed for this operation. " + str(params['operation']) + ", " + str(key))
            #    return ResCode.FAIL_WRONG_KEYWORD

        print "....... befor lock for write"
        with self._lock:
            time.sleep(KSX3267MateV2._SLEEP)
            print "....... lock for write", self.getdk(dev, 3), registers
            res = self._conn[gw["dk"]].write_registers(self.getdk(dev, 3), registers, unit=unit)

        if res.isError():
            self._logger.warn("Fail to write a request to dev." + str(dev) + "," + str(res) + ":" + str(request))
            return ResCode.FAIL_TO_WRITE

        msg = self.readactinfo(node, dev)
        if msg is None:
            self._logger.warn("Fail to read dev status.")
        else:
            self.sendnoticeforactuatorstatus(msg)
        return ResCode.OK

    def writeblk(self, blk):
        print "received message", blk.getdevid(), self._coupleid
        if BlkType.isrequest(blk.gettype()) is False:
            self._logger.warn("The message is not request. " + str(blk.gettype()))
            return False

        response = Response(blk)
        cmd = blk.getcommand()
        nd = self._devinfo.finddevbyid(blk.getnodeid())
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
            code = self.processrequest(dev, blk, nd)
            self._logger.info("Actuator processed : " + str(code))

        elif DevType.isgateway(dev['dt']):
            self._logger.info("Gateway does not receive a request")
            code = ResCode.FAIL

        else:
            self._logger.warn("Unknown Error. " + str(blk) + ", " + str(dev))
            code = ResCode.FAIL

        response.setresult(code)
        self._logger.info("write response: " + str(response))
        self.writecb(response)
        return True #if code == ResCode.OK else False

    def parseregisters(self, names, values):
        idx = 0
        ret = {}
        for nm in names:
            (size, vtype) = KSX3267MateV2._KEYWORDS[nm]
            if vtype == "float":
                val = struct.unpack('f', struct.pack('HH', values[idx], values[idx+1]))[0]
            elif vtype == "int":
                val = struct.unpack('i', struct.pack('HH', values[idx], values[idx+1]))[0]
            else:
                val = values[idx]
            ret[nm] = val
            idx = idx + size
        print "parsed", ret
        return ret
            
    def readinfofromdev(self, conn, dev):
        size = self.getsize(self.getdk(dev, 2))
        #for _ in range(3):
        res = self.readregister(conn, self.getdk(dev, 1), size, self.getdk(dev, 0))

        if res is None:
            self._logger.warn("fail to get status from " + str(dev['dk']))
            # break
        elif res.isError():
            self._logger.info("retry to get status from " + str(dev['dk']) + " " + str(res))
            # continue
        else:
            if len(res.registers) == size:
                return self.parseregisters(self.getdk(dev, 2), res.registers)
            else:
                self._logger.info("retry to get data since size of data is not matched. " + str(size) + " " + str(len(res.registers)))
        return None

    def readnodeinfo(self, node):    
        ret = {"id" : node["id"], "sen" : {}, "act" : {}, "nd" : {"status":StatCode.ERROR.value}}
        gw = self._devinfo.findgateway(node["id"])
        conn = self._conn[gw["dk"]]
        ret["conn"] = conn
        info = self.readinfofromdev(conn, node)
        if info:
            ret["nd"] = info
        else:
            self._logger.warn("fail to read node info : " + str(node))
        return ret

    def readsensornodeinfo(self, node):    
        ret = self.readnodeinfo(node)

        for dev in node['children']:
            if DevType.issensor(dev["dt"]):
                info = self.readinfofromdev(ret["conn"], dev)
                if info:
                    ret["sen"][dev["id"]] = info
            #else:
            #    self._logger.warn("fail to read sensor info : " + str(dev) + " however continue to read other device")
        return ret

    def readactnodeinfo(self, node):    
        ret = self.readnodeinfo(node)
        for dev in node['children']:
            if DevType.issensor(dev["dt"]) == False:
                info = self.readinfofromdev(ret["conn"], dev)
                if info:
                    ret["act"][dev["id"]] = info
            else:
                self._logger.warn("fail to read actuator info : " + str(dev) + " however continue to read other device")
        return ret

    def readactinfo(self, node, act):    
        ret = self.readnodeinfo(node)

        info = self.readinfofromdev(ret["conn"], act)
        if info:
            ret["act"][act["id"]] = info
        else:
            self._logger.warn("fail to read actuator info : " + str(act) + " however continue to read other device")
        return ret

    def sendobs(self):
        for msg in self._msgq:
            if msg is None:
                continue
            self.sendobservation(msg)

    def sendnoti(self):
        for gw in self._devinfo:
            for node in gw["children"]:
                ret = self.readnodeinfo(node)
                i = 1
                for dev in node['children']:
                    if DevType.issensor(dev["dt"]) == False:
                        info = self.readinfofromdev(ret["conn"], dev)
                        if info:
                            ret["act"][dev["id"]] = info
                            i = i + 1

                    if i % 3 == 0:
                        self.sendnoticeforactuatorstatus(ret)
                        ret["act"] = {}

                self.sendnoticeforactuatorstatus(ret)

    def sendobservation(self, ndinfo):
        if StatCode.has_value(ndinfo["nd"]["status"]) == False:
            ndinfo["nd"]["status"] = StatCode.ERROR.value

        obsblk = Observation(ndinfo["id"])
        obsblk.setobservation(ndinfo["id"], 0, StatCode(ndinfo["nd"]["status"]))

        for devid, info in ndinfo["sen"].iteritems():
            if StatCode.has_value(info["status"]) == False:
                info["status"] = StatCode.ERROR.value
            obsblk.setobservation(devid, info["value"], StatCode(info["status"]))

        # do not send observation for actuator
        #for devid, info in ndinfo["act"].iteritems():
        #    if StatCode.has_value(info["status"]) == False:
        #        info["status"] = StatCode.ERROR.value
        #    obsblk.setobservation(devid, 0, StatCode(info["status"]))

        self.writecb(obsblk)

    def sendnoticeforactuatorstatus(self, ndinfo):
        blk = Notice(ndinfo["id"], NotiCode.ACTUATOR_STATUS, ndinfo["id"], ndinfo["nd"])
        for devid, info in ndinfo["act"].iteritems():
            blk.setcontent(devid, info)
        self.writecb(blk)

    def start(self, writecb):
        super(KSX3267MateV2, self).start(writecb)
        return True

    def stop(self):
        super(KSX3267MateV2, self).stop()
        return True

    def getsize(self, lst):
        size =0
        for k in lst:
            if k in KSX3267MateV2._KEYWORDS:
                size = size + KSX3267MateV2._KEYWORDS[k][0]
            else:
                self._logger.warn("wrong keyword : " + str(k))
                return -1
        return size

if __name__ == "__main__":
    isnutri = False
    opt = {
        'conn' : [{
            'method': 'rtu',
            'port' : '/dev/ttyJND2',
            'baudrate' : 9600,
            'timeout': 5
        }]
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
        "id" : "1", "dk" : "JND2", "dt": "gw", "children" : [
#            {
#            "id" : "101", "dk" : '[1,201,["status"],301,["operation","opid"]]', "dt": "nd", "children" : [
#{"id" : "102", "dk" : '[1,210,["value","status"]]', "dt": "sen"},
#{"id" : "103", "dk" : '[1,220,["value","status"]]', "dt": "sen"}
#            "id" : "101", "dk" : '[1,40201,["status"],45001,["operation","opid"]]', "dt": "nd", "children" : [
#{"id" : "102", "dk" : '[1,41010,["value","status"]]', "dt": "sen"},
#{"id" : "103", "dk" : '[1,41020,["value","status"]]', "dt": "sen"}
#                {"id" : "102", "dk" : '[1,40202,["value","status"]]', "dt": "sen"},
#                {"id" : "103", "dk" : '[1,40205,["value","status"]]', "dt": "sen"},
#{"id" : "104", "dk" : '[1,40208,["value","status"]]', "dt": "sen"},
#                {"id" : "105", "dk" : '[1,40211,["value","status"]]', "dt": "sen"},
                #{"id" : "106", "dk" : '[1,40251,["value","status"]]', "dt": "sen"},
                #{"id" : "107", "dk" : '[1,40261,["value","status"]]', "dt": "sen"},
                #{"id" : "108", "dk" : '[1,40271,["value","status"]]', "dt": "sen"},
                #{"id" : "109", "dk" : '[1,40281,["value","status"]]', "dt": "sen"},
                #{"id" : "110", "dk" : '[1,40291,["value","status"]]', "dt": "sen"}
#             ]
#        }
        ]
    }]
    """
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
        kdmate = KSX3267MateV2(opt, nutriinfo, "1", None)
    else:
        kdmate = KSX3267MateV2(opt, devinfo, "1", None)

    mate = Mate ({}, [], "1", None)
    kdmate.start (mate.writeblk)
    print "mate started"

    time.sleep(10)
    req = Request(None)
    req.setcommand("1", CmdCode.DETECT_DEVICE, None)
    print "=======================================#1"
    kdmate.writeblk(req)
    print "=======================================#1"

    """
    time.sleep(1)
    req = Request(None)
    req.setcommand("1", CmdCode.CANCEL_DETECT, {})
    print "=======================================#2"
    kdmate.writeblk(req)
    print "=======================================#2"

    time.sleep(1)
    req = Request(None)
    req.setcommand("1", CmdCode.DETECT_DEVICE, None)
    print "=======================================#3"
    kdmate.writeblk(req)
    print "=======================================#3"

    time.sleep(1)
    req = Request(None)
    req.setcommand("1", CmdCode.CANCEL_DETECT, {})
    print "=======================================#4"
    kdmate.writeblk(req)
    print "=======================================#4"

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

    time.sleep(30)
    kdmate.stop()
    print "mate stopped" 
