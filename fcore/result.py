#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2019 JiNong, Inc.
# All right reserved.
#

from enum import IntEnum
from code import RetCode
from variable import Variable

class ProcResult:
    def __init__(self, retcode = RetCode.OK, proc = None, values = None): 
        if proc:
            self.setresult(proc, retcode, values)
        else:
            self._retcode = retcode
            self._values = None
            self._outputs = {}

    def __repr__(self):
        return "{}({}, {}, {})".format(self.__class__.__name__, str(self._retcode), str(self._values), str(self._outputs))

    def getretcode(self):
        return self._retcode

    def setretcode(self, retcode):
        self._retcode = retcode

    def getvalues(self):
        return self._values

    def setresult(self, proc, retcode, values):
        self._retcode = retcode
        self._values = values
        proc["pvalues"] = values
        if "outputs" in proc:
            tmp = {}
            for item in zip(proc["outputs"], values):
                tmp[item[0]] = Variable(item[1])
            self._outputs = tmp
        else:
            self._outputs = {}
     
    def getoutputs(self):
        return self._outputs
  

    def getoutput(self, name):
        if self._outputs and name in self._outputs:
            return self._outputs[name]
        return None
