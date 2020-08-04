#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2018 JiNong, Inc.
# All right reserved.
#

"""
    Base Mate를 정의함.
"""

import time
import util
import logging
import logging.handlers
import traceback
from calibration import Calibrator
from threading import Thread
from mblock import MBlock, BlkType
from enum import Enum
from devtype import DevType
from datetime import datetime
from dinfo import DevInfo

class Mate(object):
    """
    Mate의 기본형을 정의함.
    """

    def __init__(self, option, devinfo, coupleid, logger=None):
        """
        Mate 의 Constructor. option과 devinfo를 주요 입력으로 함.
        
        :param option: 작동을 위한 설정을 딕셔너리로 전달함
        :param devinfo: 처리하는 장비의 아이디를 딕셔너리 형식으로 전달함. 다음과 같은 형식임.
        id 는 장비의 아이디, dk 는 장비를 확인하기 위한 키값, dt는 장비의 타입, children은 하위 장비가 있는 경우에 하위 장비를 표현하기 위한 용도임.
        devinfo : [
            {"id" : "3", "dk" : "1", "dt": "nd", "children" : [
                {"id" : "4", "dk" : "0", "dt": "sen"},
                {"id" : "5", "dk" : "1", "dt": "sen"},
                {"id" : "6", "dk" : "2", "dt": "act"},
                {"id" : "7", "dk" : "3", "dt": "act/retractable/level0"}
            ]}
        ]
        :param coupleid: 커플아이디.
        :param logger: 로깅을 위한 로거. 없다면 내부적으로 만듬.
        """
        self._option = option
        print "mate initialized. ", option

        self._coupleid = coupleid
        self._sleep = {"time": 3, "obs": 19, "noti": 19} if "sleep" not in option else option["sleep"]
        self._devinfo = DevInfo(devinfo)
        self._writecb = None
        self._executing = False
        self._connected = False
        self._msgq = None

        if "backup" in option and "prefix" in option["backup"]:
            self._backup = True
        else:
            self._backup = False

        if logger is None:
            self._logger = util.getdefaultlogger()
        else:
            self._logger = logger 
        self._calibrator = Calibrator(option, self._logger)

    def __repr__(self):
        return "{}({},{})".format(self.__class__.__name__, str(self._option), str(self._devinfo))

    def start(self, _writecb):
        """ Mate가 시작할때 호출됨 """
        self._executing = True
        self._writecb = _writecb
        return True

    def stop(self):
        """ Mate가 중지될때 호출됨 """
        self._executing = False
        return True

    def connect(self):
        self._connected = True
        return True

    def close(self):
        self._connected = False

    def getvalue(self, k, v):
        """ 
        센서값을계산할때 사용함
        Calibrator 를 사용하며, 설정이 없는 경우 raw 값을 돌려줌
        """
        return self._calibrator.calculate(k, v)

    def isexecuting(self):
        """ Mate가 작동중인지를 확인함 """
        return self._executing

    def isconnected(self):
        """ Mate가 연결되어 있는지를 확인함 """
        return self._connected

    def writeblk(self, blk):
        """ 외부에서 데이터 전달을 위해 호출되는 메소드. """
        # external callback
        print "###message : ", blk.get()

    def readmsg(self):
        """ Mate가 메세지를 읽는 함수. 직접구현해야함.  """
        self._msgq = [MBlock(0, BlkType.NONE, None)]

    def backup(self, blk):
        fname = "backup/" + self._option["backup"]["prefix"] + "-" + datetime.now().strftime("%Y%d%m") + ".bak"
        with open(fname, "a") as fp:
            fp.write(blk.stringify() + "\n")

    def writecb(self, blk):
        self._writecb(blk)
        # backup
        if self._backup:
            self.backup(blk)

    def sendobs(self):
        """ 관측치를 전송한다. writecb를 사용함. """
        pass

    def sendnoti(self):
        """ 노티를 전송한다. writecb를 사용함. """
        pass

    def run(self):
        print "mate run ... sleep : ", self._sleep["time"]
        scnt = 0
        while self.isexecuting():
            try:
                while self.isexecuting() == True and self.isconnected() == False:
                    if self.connect() == False:
                        self._logger.info("sleep 10 seconds and try to connect")
                        time.sleep(10)
                    else:
                        self._logger.info("reconnected!!")

                if self.isexecuting() == False:
                    break

                time.sleep(self._sleep["time"])
                self.readmsg()

                if scnt % self._sleep["obs"] == 0:
                    self.sendobs()
                if scnt % self._sleep["noti"] == 0:
                    self.sendnoti()

                scnt = scnt + 1
            except Exception as ex:
                self._logger.warn("There is an exception : " + str(ex))
                self._logger.warn(str(traceback.format_exc()))
                try:
                    self.close()
                except:
                    pass

        print "mate stop"

class ThreadMate(Mate):
    def __init__(self, option, devinfo, coupleid, logger=None):
        super(ThreadMate, self).__init__(option, devinfo, coupleid, logger)
        self._logger.info("Mate Started.")

    def start(self, _writecb):
        """ 
        Mate가 시작할때 호출
        :param writecb: 다른 메이트의 콜백메소드
        """
        super(ThreadMate, self).start(_writecb)
        self._thd = Thread(target=self.run)
        self._thd.start()
        return True

    def stop(self):
        """ Mate가 중지될때 호출됨 """
        super(ThreadMate, self).stop()
        self._thd.join()
        return True

if __name__ == "__main__":
    mate = ThreadMate({}, [])
    mate2 = Mate({}, [])
    mate2
    mate.start(mate2.writeblk)
    print "mate started"
    time.sleep(3)
    mate.stop()
    print "mate stopped"
