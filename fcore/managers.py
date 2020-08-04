#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2019 JiNong, Inc.
# All right reserved.
#

import json
import pymysql
import time
import traceback
import paho.mqtt.client as mqtt
import paho.mqtt.publish as publish
from datetime import datetime

import util
import processors
from result import RetCode, ProcResult
from mblock import Request
from variable import Variable

class Manager(object):
    def __init__(self, option, logger):
        self._conn = None
        self._cur = None
        self._logger = logger
        self._option = option

    def updatedb(self, conn, cur):
        self._conn = conn
        self._cur = cur

class DataManager(Manager):
    def __init__(self, option, logger):
        self._data = {}
        super(DataManager, self).__init__(option, logger)

    def loaddata(self):
        query = "select * from current_observations"
        self._cur.execute(query, [])
        for row in self._cur.fetchall():
            if row["nvalue"] is not None:
                v = Variable()
                v.setfromdb(row)
                self._data[row['data_id']] = v
            else:
                self._logger.warn(str(row['data_id']) + " is not available.")

    def updatedata(self, dataid, value):
        if dataid in self._data:
            self._data[dataid].setvalue(value)
        else:
            self._logger.info("Set a new data : " + str(dataid) + " " + str(value))
            self._data[dataid] = Variable(value)

    def writedata(self):
        uquery = "update current_observations set nvalue = %s, obs_time = %s, modified_time = %s where data_id = %s"
        iquery = "insert into observations(data_id, obs_time, nvalue) values (%s, %s, %s)"
        for dataid, variable in self._data.items():
            if variable.isupdated():
                print("writedata", dataid, variable)
                self._cur.execute(uquery, [variable.getvalue(), variable.getobserved(), variable.getmodified(), dataid])
                self._cur.execute(iquery, [dataid, variable.getobserved(), variable.getvalue()])
        self._conn.commit()

    def getdata(self, dataid):
        return self._data[dataid]

    def preprocess(self):
        pass

class TimeSpanManager(Manager):
    def __init__(self, option, logger):
        self._timespans = {}
        self._day = time.localtime(time.time()).tm_yday
        super(TimeSpanManager, self).__init__(option, logger)

    def updatesuntimespan(self, ts):
        if ts["configuration"]["timing"] == "sun":
            suntime = util.SunTime(ts["configuration"]["longitude"], ts["configuration"]["latitude"])
            sunrise = suntime.getsunrise()
            sunset = suntime.getsunset()
            for part in ts["parts"]:
                if part["type"] == "rise+":
                    part["to"] = sunrise + int(part["value"])
                elif part["type"] == "rise-":
                    part["to"] = sunrise - int(part["value"])
                elif part["type"] == "set+":
                    part["to"] = sunset + int(part["value"])
                elif part["type"] == "set-":
                    part["to"] = sunset - int(part["value"])
                else:
                    part["to"] = int(part["to"])
                print("update suntimespan", part)
        return ts

    def updatetimespans(self):
        if self._day == time.localtime(time.time()).tm_yday:
            return 

        # It needs to recalculate once a day.
        self._day = time.localtime(time.time()).tm_yday
        for tmp, ts in self._timespans.items():
            self.updatesuntimespan(ts)

    def addtimespan(self, tsid, fldid, timespan):
        print("addtimespan", tsid, fldid, timespan)
        self._timespans[(tsid, fldid)] = timespan
        if timespan["configuration"]["timing"] == "sun":
            self.updatesuntimespan(timespan)
        elif timespan["configuration"]["timing"] == "fixed":
            for p in timespan["parts"]:
                p["to"] = int(p["to"])

        else: 
            self._logger.warn("Unknown timing : " + str([tsid, fldid, timespan["configuration"]["timing"]]))

        timespan["tvar"] = {"tsidx": Variable(0)}
        for th in timespan["threshold"]:
            timespan["tvar"]["#" + th["id"]] = Variable() 

    def loadtimespan(self, updated):
        query = "select * from core_timespan where unix_timestamp(updated) > %s and field_id in (select id from fields where deleted = 0)"
        self._cur.execute(query, [updated])
        for row in self._cur.fetchall():
            if row['field_id'] < 0:
                continue

            self.addtimespan(row['id'], row['field_id'], json.loads(row['timespan']))

    def getcurrentindex(self, tsid, fldid):
        now = datetime.now()
        nsec = (now - now.replace(hour=0, minute=0, second=0, microsecond=0)).total_seconds()

        if tsid == 0:
            return (0, nsec)

        timespan = self._timespans[(tsid, fldid)]

        idx = -1
        for i in range(len(timespan["parts"])):
            if timespan["parts"][i]["to"] > nsec:
                print("found timespan index : ", i, timespan["parts"][i]["to"], nsec)
                idx = i
                break

        if idx < 0:
            self._logger.warn("Fail to get current timespan for tsid : " + str(tsid) + " " + str(nsec))
            return None
        return (idx, nsec)


    def getthresholdvalue(self, part, opt, idx, current):
        if idx == 0:
            return opt[0]["to"]
        else:
            ratio  = ((current * 1.0 - part[idx-1]["to"]) / (part[idx]["to"] - part[idx-1]["to"]))
            return opt[idx-1]["to"] + (opt[idx]["to"] - opt[idx-1]["to"]) * ratio


    def getthresholds(self, tsid, fldid, idx, current):
        if tsid == 0:
            return {}

        timespan = self._timespans[(tsid, fldid)]
        ret = {}
        timespan["tvar"]["tsidx"].setvalue(idx)
        for th in timespan["threshold"]:
            timespan["tvar"]["#" + th["id"]].setvalue(self.getthresholdvalue(timespan["parts"], th["timeoption"], idx, current))
        print("thresholds", timespan["tvar"])
        return timespan["tvar"]

class DeviceManager(Manager):
    def __init__(self, option, logger):
        self._devices = {}
        super(DeviceManager, self).__init__(option, logger)

    def loaddevices(self, updated):
        query = "select a.id, a.coupleid, a.gateid, a.deleted, b.id nodeid from devices a, (select * from devices where devindex is null) b where unix_timestamp(a.updated) > %s and a.nodeid = b.nodeid and a.deleted = 0"
        self._cur.execute(query, [updated])
        for row in self._cur.fetchall():
            if row["deleted"] == 1:
                if row["id"] in self._devices:
                    del self._devices[row["id"]]
            else:
                self._devices[row["id"]] = row
        print("devices ", self._devices)

    def getdevice(self, devid):
        print("getdevice", devid)
        return self._devices[devid]

class RuleManager(Manager):

    _DEF_PRIORITY = 6
    _DEF_PERIOD = 60

    def __init__(self, option, logger):
        self._data = DataManager(option, logger)
        self._timespan = TimeSpanManager(option, logger)
        self._devices = DeviceManager(option, logger)
        self._lastupdated = 0
        self._rules = [{}, {}, {}, {}, {}, {}, {}]
        self._procs = {
            "mod" : processors.ModuleProcessor(logger),
            "ext" : processors.ExternalProcessor(logger),
            "eq" : processors.EquationProcessor(logger),
        }
        super(RuleManager, self).__init__(option, logger)

    def updatedb(self, conn, cur):
        self._conn = conn
        self._cur = cur
        self._timespan.updatedb(conn, cur)
        self._data.updatedb(conn, cur)
        self._devices.updatedb(conn, cur)

    def process(self):
        updated = self._lastupdated
        self._devices.loaddevices(updated)
        self._data.loaddata()
        self._data.preprocess()
        self._timespan.updatetimespans()
        self.loadappliedrules(updated)
        self.processrules()
        self._data.writedata()
        self._lastupdated = int(time.time())

    def getpriorityfromruleset(self, ruleid):
        # find
        for idx in range(7):
            if ruleid in self._rules[idx]:
                return idx
        return -1

    def updateruleset(self, rule):
        ruleid = rule["id"]

        found = self.getpriorityfromruleset(ruleid)
        if found >= 0: # should be deleted from ruleset
            del self._rule[found][ruleid]

        if rule["used"] > 0 and rule["deleted"] == 0:
            priority = rule["inputs"]["priority"].getvalue()
            self._rules[priority][rule['id']] = rule

    def loadappliedrules(self, updated):
        self._timespan.loadtimespan(updated)

        print("loadappliedrules", updated)
        query = "select * from core_rule_applied where unix_timestamp(updated) >= %s"
        self._cur.execute(query, [updated])
        for row in self._cur.fetchall():
            try:
                rule = self.loadrule(row)
                self.updateruleset(rule)
            except Exception as ex:
                self._logger.warn ("Fail to load a rule : " + str(ex) + " " + str(row))
                self._logger.warn(str(traceback.format_exc()))


    def loadrule(self, row):
        if row["used"] == 0 or row["deleted"] > 0:
            return {
                "id" : row["id"],
                "used" : row["used"],
                "deleted" : row["deleted"]
            }

        conf = json.loads(row["configurations"])
        kid = {}
        kv = {}
        for datum in conf["basic"]:
            kv[datum["key"]] = Variable(datum["value"])
        for datum in conf["advanced"]:
            kv[datum["key"]] = Variable(datum["value"])

        if "priority" not in kv:
            kv["priority"] = Variable(RuleManager._DEF_PRIORITY)
        else:
            priority = kv["priority"].getvalue()
            if priority < 0: priority = 0
            if priority > 5: priority = 6

        if "period" not in kv:
            kv["period"] = Variable(RuleManager._DEF_PERIOD)
            
        if row["inputs"] is not None:
            inputs = json.loads(row["inputs"])
            for datum in inputs:
                kv[datum["key"]] = self._data.getdata(datum["dataid"])
                kid[datum["key"]] = datum["dataid"]

        outputs = json.loads(row["outputs"])
        for (did, key) in self.getoutputdata(row["id"], outputs):
            #self._data.updatedata(did, 0) # temporary
            kv[key] = self._data.getdata(did)
            kid[key] = did

        print("rule inputs", kv)

        ctrls = json.loads(row["controllers"])
        for proc in ctrls['processors']:
            proc["pvalues"] = None

        return {
            "id" : row["id"],
            "name" : row["name"],
            "field" : row["field_id"],
            "used" : row["used"],
            "deleted" : row["deleted"],
            "timespan" : conf["timespan"],
            "constraints" : json.loads(row["constraints"]),
            "controllers" : ctrls,
            "inputs" : kv,
            "_inputs" : kid,
            "outputs" : outputs,
            "executed" : 0
        }

    def setinputdata(self, rule):
        for key, did in rule["_inputs"].items():
            rule["inputs"][key] = self._data.getdata(did)
        
    def processrules(self):
        ret = []
        now = int(time.time())
        print("now", now)
        for rules in self._rules:
            for rid, rule in rules.items():
                try:
                    print("rule", rule["name"], rule["executed"])
                    if rule["executed"] + rule["inputs"]["period"].getvalue() < now:
                        self._logger.info(rule["name"] + " is executing.")
                        self.setinputdata(rule)
                        tmp = self.executerule(rule)
                        ret.append({"ruleid": rid, "result": tmp})
                        rule["executed"] = now
                        print("rule executed ", rule["name"], rule["executed"])
                    else:
                        self._logger.info(rule["name"] + " is waiting.")
                except Exception as ex:
                    self._logger.warn ("Fail to execute a rule : " + str(rid) + " " + str(ex))
                    self._logger.warn(str(traceback.format_exc()))
                    ret.append({"ruleid": rid, "result": {"code" : RetCode.UNKNOWN_ERROR}})
        return ret

    def finddevid(self, rule, target):
        for dev in rule["constraints"]["devices"]:
            print("dev", dev)
            if "outputs" in dev and dev["outputs"] == target:
                return dev["deviceid"]

    def rearrangeresult(self, ret):
        newret = {}
        for tmp in ret[1:]:
            if tmp.getretcode() == RetCode.OK:
                for key, value in tmp.getoutputs().items():
                    print("rearrange result ", key, value)
                    newret[key] = value
        return newret

    def getdataid(self, ruleid, outcode):
        return 30000000 + ruleid * 10000 + outcode

    def getoutputdata(self, ruleid, outputs):
        ret = []
        if "data" not in outputs:
            return ret
        for out in outputs["data"]: 
            dataid = self.getdataid(ruleid, out["outcode"])
            ret.append([dataid, out["outputs"]])
        return ret

    def processdata(self, rule, ret, newret):
        for idx in range(len(ret)):
            dataid = 30000000 + rule["id"] * 10000 + idx * 100
            if idx == 0 and ret[idx].getretcode() != RetCode.OK: # trigger는 실패시에만 저장함
                self._data.updatedata(dataid, ret[idx].getretcode().value)

        if "data" not in rule["outputs"]:
            return 

        for out in rule["outputs"]["data"]: 
            dataid = self.getdataid(rule["id"], out["outcode"])
            var = newret[out["outputs"]]
            if var is None:
                self._logger.warn("Fail to find output : " + str(out["outputs"]))
            else:
                print("data", dataid, out["outputs"], var.getvalue())
                self._data.updatedata(dataid, var.getvalue())

    def sendrequest(self, dev, cmd, params):
        print("send req", dev["id"], cmd, params)
        if dev and "nodeid" in dev and dev["nodeid"]:
            req = Request(dev["nodeid"]) 
            req.setcommand(dev["id"], cmd, params)
            topic = "/".join(["cvtgate", dev["coupleid"], str(dev["gateid"]), "req", str(dev["nodeid"])])
            ret = publish.single(topic, payload=req.stringify(), qos=2, hostname=self._option["mqtt"]["host"])
            print("mqtt", ret, topic, req.stringify())
            return req
        else:
            self._logger.warn("Not enough infomation for a device.", dev)
            return None

    def processrequest(self, rule, ret, newret):
        if "req" not in rule["outputs"]:
            return 

        reqs = []
        for out in rule["outputs"]["req"]:
            print("req1")
            cmd = newret[out["cmd"]].getvalue()
            if cmd is None:
                print("cmd is None. Do not make a request.")
                continue

            params = {}
            for idx in range(len(out["params"])):
                param = out["params"][idx]
                if "pnames" in out:
                    pname = out["pnames"][idx]
                else:
                    pname = param[1:]
                params[pname] = newret[param].getvalue()   # remove '#'

            print("req2")

            for target in out["targets"]:
                devid = self.finddevid(rule, target)
                dev = self._devices.getdevice(devid)
                req = self.sendrequest(dev, cmd, params)
                if req:
                    reqs.append(req)

        return reqs

    def executerule(self, rule):
        ret = self._timespan.getcurrentindex(rule["timespan"]["id"], rule["field"])
        if ret is None:
            self._logger.warn(rule["name"] + " is failed to get timespan.")
            return ProcResult(RetCode.WRONG_TIMESPAN)

        used = rule["timespan"]["used"]
        if used[ret[0]] is False:
            self._logger.info(rule["name"] + " is not used now. (" + str(ret) + "," + str(used) + ")")
            return ProcResult(RetCode.NOT_USED)

        rule["tsidx"] = ret[0]

        thresholds = self._timespan.getthresholds(rule["timespan"]["id"], rule["field"], ret[0], ret[1])
        rule["inputs"].update(thresholds)

        ctrl = rule["controllers"]
        if 'trigger' not in ctrl:
            ret = [ProcResult(RetCode.OK)]
        else:
            try:
                tmp = self._procs[ctrl["trigger"]["type"]].evaluate(rule, ctrl["trigger"], self._cur)
                if tmp.getretcode() != RetCode.OK:
                    self._logger.info(rule["name"] + " trigger is failed : " + str(tmp.getretcode()))
                    return tmp

                if tmp.getvalues()[0] == 0:
                    tmp.setretcode(RetCode.TRIGGER_NOT_ACTIVATED)
                    self._logger.info(rule["name"] + " trigger is not activated.")
                    return tmp             # trigger is not activated

            except Exception as ex:
                self._logger.warn(rule["name"] + " trigger is failed to execute. " + str(ex))
                self._logger.warn(str(traceback.format_exc()))
                return ProcResult(RetCode.PROCESSOR_EXECEPTION) # trigger is failed to execute

            ret = [tmp]
        
        for idx in range(len(ctrl["processors"])):
            try:
                proc = ctrl["processors"][idx]
                tmp = self._procs[proc["type"]].evaluate(rule, proc, self._cur)
                if tmp.getretcode() == RetCode.OK:
                    rule["inputs"].update(tmp.getoutputs())

            except Exception as ex:
                self._logger.warn(rule["name"] + " (" + str(idx) + ") is failed to execute. " + str(ex))
                self._logger.warn(str(traceback.format_exc()))
                tmp = ProcResult(RetCode.PROCESSOR_EXCEPTION) 

            ret.append(tmp)

        # make output
        newret = self.rearrangeresult(ret)
        print(ret, newret)

        self.processdata(rule, ret, newret)
        reqs = self.processrequest(rule, ret, newret)

        return reqs

if __name__ == '__main__':
    ts = TimeSpanManager({}, util.getdefaultlogger())
    ts.addtimespan(1, 1, [{"to" : 10000}])
    assert ts.getcurrentts((0, 0)) == 0, "timespan is not matched #1"
    now = datetime.now()
    nsec = (now - now.replace(hour=0, minute=0, second=0, microsecond=0)).total_seconds()
    ans = 0 if nsec < 10000 else -1
    assert ts.getcurrentts((1, 1)) == ans, "timespan is not matched #2" 

    rulemng = RuleManager({}, util.getdefaultlogger())
