#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2018 JiNong, Inc.
# All right reserved.
#

import time
import math
import json
import subprocess32
import importlib
from simpleeval import simple_eval

import util 
from result import RetCode, ProcResult

class Processor(object):
    """
    컨트롤러가 가지고있는 작업단위인 프로세서를 처리하기 위한 클래스

    프로세서간 데이터 활용을 위해서는 outputs 로 전달이 되어야 한다.
    values 로 전달이 되는 임시값은 단일 프로세서에서만 의미를 갖는다.
    """

    def __init__(self, logger):
        """
        Processor 의 Constructor
        :param logger: 로깅을 위한 로거.
        """
        self._logger = logger

    def evaluate(self, rule, proc):
        """
        개별 processsor 를 평가하기위한 메소드
        :param rule: 룰 
        :param proc: 실행할 프로세서
        """
        pass

class ModuleProcessor(Processor):
    """
    기 구현된 모듈을 사용하여 평가하는 프로세서
    외부 모듈은 (RetCode, [result1, result2, ...]) 의 형식으로 리턴해야한다.
    result1, result2... 는 모듈을 실행한 결과물이고, 이는 순서대로 outputs에 매칭된다. 
    outputs에 매칭되지 않는 값들은 룰에서 사용되지는 않지만 모듈의 다음 계산을 위해 사용될 임시값으로 간주한다.
    """
    def __init__(self, logger):
        super(ModuleProcessor, self).__init__(logger)

    def evaluate(self, rule, proc, dbcur):
        (modname, funcname) = proc["mod"].split(".")

        mod = importlib.import_module("modules." + modname)
        func = getattr(mod, funcname)

        (retcode, values) = func(rule["inputs"], proc["pvalues"], dbcur)
        return ProcResult(retcode, proc, values)

def f_exp(x):
    return math.exp(x)

class EquationProcessor(Processor):
    """
    단순한 수식을 평가하는 프로세서
    해킹 방지를 위해서 simple_eval을 사용함
    """
    def __init__(self, logger):
        super(EquationProcessor, self).__init__(logger)
        self._tmpdata = None

    def evaluate(self, rule, proc, dbcur):
        self._tsidx = rule["tsidx"]
        self._tmpdata = rule["inputs"]
        values = []
        if isinstance(proc["eq"], list):
            for eq in proc["eq"]:
                values.append (simple_eval(eq, names=self.namehandler, functions={"exp":f_exp}))
        else:
            values.append (simple_eval(proc["eq"], names=self.namehandler, functions={"exp":f_exp}))
        
        print proc["eq"], "evaluated.", values
        return ProcResult(RetCode.OK, proc, values)

    def namehandler(self, node):
        print "#" + node.id, self._tmpdata["#" + node.id].gettsvalue(self._tsidx)
        return self._tmpdata["#" + node.id].gettsvalue(self._tsidx)

class ExternalProcessor(Processor): 
    """
    외부 프로세스를 실행하여 평가하는 프로세서
    외부 프로세스에 대한 최대 실행시간은 5초를 초과할 수 없다.
    외부 프로세스를 위해 이전 데이터를 전달하거나 하지는 않는다.
    """
    _TIMEOUT = 5
    def __init__(self, logger):
        super(ExternalProcessor, self).__init__(logger)

    def _makeargs(self, proc, data):
        args = [proc["cmd"]]
        for key in proc["args"]:
            if key in data:
                args.append(data[key].getvalue())
            else:
                args.append(key)
        return args

    def evaluate(self, rule, proc, dbcur):
    	lines = subprocess32.check_output(self._makeargs(proc, rule["inputs"]), 
        	timeout=self._TIMEOUT, universal_newlines=True)
        values = map(float, lines.split("\n"))

        return ProcResult(RetCode.OK, proc, values)

if __name__ == '__main__':
    eqproc = EquationProcessor(util.getdefaultlogger())
    print eqproc.evaluate({"field_id" : 1, "inputs": {"#bottomtemp0" : {"nvalue" : 0}, "#middletemp0": {"nvalue" : 0}, "#uptemp0": {"nvalue" : 0}, "#alc0" : {"nvalue" : 0}}}, {"type" : "eq", "eq": "0 if bottomtemp0 != 0 and middletemp0 != 0 else 1"}) 

    mdproc = ModuleProcessor(util.getdefaultlogger())
    print mdproc.evaluate({"field_id" : 1, "inputs": {"#bottomtemp1" : {"nvalue" : 10},
        "#middletemp1" : {"nvalue" : 11},
        "#uptemp1" : {"nvalue" : 12},
        "#secondtime" : {"nvalue" : int(time.time()) + 10},
        "#firsttime" : {"nvalue" : int(time.time()) - 10},
        "#diff1" : {"nvalue" : 10},
        "#coldwork1" : {"nvalue" : 10}}}, {"type" : "mod", "mod": "iotrrw.coldwater", "outputs": ["#alert", "#coldwater"]})
