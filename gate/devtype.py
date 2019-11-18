#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2019 JiNong, Inc.
# All right reserved.
#

import time
import logging
import logging.handlers
from calibration import Calibrator
from threading import Thread
from mblock import MBlock, BlkType, CmdCode
from enum import Enum

class DevType:
    GATEWAY = "gw"
    NODE    = "nd"
    SENSOR  = "sen"
    ACTUATOR = "act"

    RETRACTABLE = "retractable"
    SWITCH = "switch"
    NUTSUPPLY = "nutrient-supply"

    LV0 = "level0"
    LV1 = "level1"
    LV2 = "level2"

    DEFAULT_ACTUATOR = ["act", "switch", "level0"]

    @staticmethod
    def issameclass(devtype, cls):
        if devtype[:len(cls)] == cls:
            return True
        return False

    @staticmethod
    def isgateway(devtype):
        if devtype[:2] == DevType.GATEWAY:
            return True
        return False

    @staticmethod
    def isnode(devtype):
        if devtype[:2] == DevType.NODE:
            return True
        return False

    @staticmethod
    def issensor(devtype):
        if devtype[:3] == DevType.SENSOR:
            return True
        return False

    @staticmethod
    def isactuator(devtype):
        if devtype[:3] == DevType.ACTUATOR:
            return True
        return False

    @staticmethod
    def isswitch(devtype):
        if DevType.isactuator(devtype):
            if DevType.getdevice(devtype) == DevType.SWITCH:
                return True
        return False

    @staticmethod
    def isretractable(devtype):
        if DevType.isactuator(devtype):
            if DevType.getdevice(devtype) == DevType.RETRACTABLE:
                return True
        return False

    @staticmethod
    def isnutsupplier(devtype):
        if DevType.isactuator(devtype):
            if DevType.getdevice(devtype) == DevType.NUTSUPPLY:
                return True
        return False

    @staticmethod
    def getdevice(devtype):
        return devtype.split("/")[1]

    @staticmethod
    def getlevel(devtype, cls, dev):
        dt = devtype.split("/")
        if dt[0] == cls and dt[1] == dev:
            if dt[2] == DevType.LV0:
                return 0
            elif dt[2] == DevType.LV1:
                  return 1
            elif dt[2] == DevType.LV2:
                  return 2
            #return int(dt[2][5])
        return -1

    @staticmethod
    def getretractablelevel(devtype):
        return DevType.getlevel(devtype, DevType.ACTUATOR, DevType.RETRACTABLE)

    @staticmethod
    def getswitchlevel(devtype):
        return DevType.getlevel(devtype, DevType.ACTUATOR, DevType.SWITCH)
        
    @staticmethod
    def getnutsupplierlevel(devtype):
        return DevType.getlevel(devtype, DevType.ACTUATOR, DevType.NUTSUPPLY)

    @staticmethod
    def ispropercommand(devtype, cmdcode):
        lv = DevType.getretractablelevel(devtype)
        if lv >= 0 and cmdcode in [CmdCode.OFF, CmdCode.OPEN, CmdCode.CLOSE]:
            return True
        if lv >= 1 and cmdcode in [CmdCode.TIMED_OPEN, CmdCode.TIMED_CLOSE, CmdCode.SET_TIME]:
            return True
        if lv == 2 and cmdcode in [CmdCode.POSITION]:
            return True

        lv = DevType.getswitchlevel(devtype)
        if lv >= 0 and cmdcode in [CmdCode.OFF, CmdCode.ON]:
            return True
        if lv >= 1 and cmdcode in [CmdCode.TIMED_ON]:
            return True
        if lv >= 2 and cmdcode in [CmdCode.DIRECTIONAL_ON]:
            return True

        lv = DevType.getnutsupplierlevel(devtype)
        if lv >= 0 and cmdcode in [CmdCode.CHANGE_CONTROL, CmdCode.OFF, CmdCode.ONCE_WATERING]:
            return True
        if lv >= 1 and cmdcode in [CmdCode.PARAMED_WATERING]:
            return True

        if DevType.isnode(devtype) and cmdcode in [CmdCode.RESET]:
            return True

        if DevType.isgateway(devtype) and cmdcode in [CmdCode.DETECT_DEVICE, CmdCode.CANCEL_DETECT, CmdCode.DAEMON_RESTART]: #, CmdCode.UPDATE_SPEC]:
            return True

        print("It's not a proper command[" + str(cmdcode) + "] for " + str(devtype))
        return False

