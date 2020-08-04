#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2018 JiNong, Inc.
# All right reserved.
#

"""
    Calibrator 를 정의함
"""

import logging
import logging.handlers
import util
from collections import deque

"""
option = { 
  "calibration" : {
    "1" : {"type" : "linear", "args": {"a" : 0.1, "b" : 5}},   # a * x + b
    "2" : {"type" : "case", "args": [[300, 400, 90], [600, 800, 135]]},   # if 300 <= x 400 then 90
    "3" : {"type" : "interpolation", "args": [[300, 400, 90, 4], [600, 800, 135, 0.1]]},   # if 300 <= x 400 then an interpolated value btw 90 and 4
    "4" : {"type" : "no", "args": None},   # x
  },
  "buffer" : 5
}
"""

class Calibrator:
    """
    Calibrator 는 데이터값을 변환할 수 있는 방법을 제공하는 클래스임.
    """
    def __init__(self, option, logger):
        """
        Calibrator 의 Constructor.
        :param option: 작동을 위한 설정을 딕셔너리로 전달함
        :param logger: 로깅을 위한 로거. 
        """
        if logger is None:
            self._logger = util.getdefaultlogger()
        else:
            self._logger = logger

        if "calibration" not in option:
            self._option = None
            self._logger.info ("There is no information of calibration")
        else:
            self._option = option["calibration"]

        if "buffer" not in option:  # 있다고 하더라도 최소한 3은 넘어야 함
            self._buffer = None
            self._buflen = 0
        else:
            self._buffer = {}
            self._buflen = option["buffer"]

    def loadbuffer(self, sid, raw):
        """
        sid를 키값으로 하여 버퍼를 확인하고, 최대값과 최소값을 제외한 평균값을 반환함.
        :param sid: 변환 키 아이디 (센서 아이디)
        :param raw: 변환하고자 하는 값
        """
        if self._buflen > 2:
            if sid in self._buffer:
                dq = self._buffer[sid]
                dq.append(raw)
                return (sum(dq) - min(dq) - max(dq)) / (len(dq) - 2)
            else:
                self._buffer[sid] = deque([raw] * self._buflen, maxlen=self._buflen)
        return raw 

    def calculate(self, sid, raw):
        """
        sid를 키값으로 하여 표현식을 확인하고 raw를 해당 표현식으로 변환하여 반환함.
        :param sid: 변환 키 아이디 (센서 아이디)
        :param raw: 변환하고자 하는 값
        """
        value = self.loadbuffer(sid, raw)

        if self._option is None:
            self._logger.warn("There is no option for calibration.")
            return value

        if str(sid) not in self._option:
            self._logger.info("There is no calibration option for " + str(sid))
            return value

        opt = self._option[str(sid)]

        try:
            if opt["type"] == "linear":
                return opt["args"]["a"] * value + opt["args"]["b"]
            elif opt["type"] == "case":
                for c in opt["args"]:
                    if value >= c[0] and value < c[1]:
                        return c[2]
                self._logger.warn ("fail to calculate by cases" + str(value))
                return None
            elif opt["type"] == "interpolation":
                for c in opt["args"]:
                    if value >= c[0] and value < c[1]:
                        return (value * 1.0 - c[0]) / (c[1] -c [0]) * (c[3] - c[2]) + c[2]
            else:
                return value
                
        except Exception as ex:
            self._logger.warn("fail to calculate " + str(ex))
            return None

if __name__ == "__main__":
    option = { "calibration" : {
        "1" : {"type" : "linear", "args": {"a" : 0.1, "b" : 5}},   # a * x + b
        "2" : {"type" : "case", "args": [[300, 400, 90], [600, 800, 135]]},   # if 300 <= x 400 then 90
        "3" : {"type" : "interpolation", "args": [[300, 400, 90, 4], [600, 800, 200, 400]]},   # if 300 <= x 400 then 90 * v + 4
    }}
    
    cal = Calibrator(option, None)
    if cal.calculate(1, 10) == 6:
        print "test 1 - linear ok"
    if cal.calculate(2, 610) == 135:
        print "test 2 - case ok"
    if cal.calculate(3, 610) == 210:
        print "test 3 - interpolation ok"
    if cal.calculate(4, 610) == 610:
        print "test 4 - no ok"
