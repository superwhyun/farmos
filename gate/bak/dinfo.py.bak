#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2018 JiNong, Inc.
# All right reserved.
#

"""
    DevInfo 를 정의함.
"""

import time
import logging
import logging.handlers
from calibration import Calibrator
from threading import Thread
from mblock import MBlock, BlkType
from enum import Enum
from devtype import DevType
from datetime import datetime

class DevInfo(object):
    """
    DevInfo를 다루는 클래스
    """

    def __init__(self, devinfo):
        """
        DevInfo 의 Constructor. devinfo를 주요 입력으로 함.
        
        :param devinfo: 처리하는 장비의 아이디를 딕셔너리 형식으로 전달함. 다음과 같은 형식임.
        id 는 장비의 아이디, dk 는 장비를 확인하기 위한 키값, dt는 장비의 타입, children은 하위 장비가 있는 경우에 하위 장비를 표현하기 위한 용도임.
        devinfo : [
          {"id" : "1", "dk" : "1", "dt": "gw", "children" : [
            {"id" : "3", "dk" : "1", "dt": "nd", "children" : [
              {"id" : "4", "dk" : "0", "dt": "sen"},
              {"id" : "5", "dk" : "1", "dt": "sen"},
              {"id" : "6", "dk" : "2", "dt": "act"},
              {"id" : "7", "dk" : "3", "dt": "act/retractable/level0"}
            ]}
          ]}
        ]
        """
        assert type(devinfo) == list, "Device Info should be a list."
        
        if len(devinfo) == 0:
            self._devinfo = [{"id" : "__nogw", "dk" : "__nogw", "dt": "gw", "children": []}]
        elif DevType.isgateway(devinfo[0]["dt"]):
            self._devinfo = devinfo
        elif DevType.isnode(devinfo[0]["dt"]):
            self._devinfo = [{"id" : "__nogw", "dk" : "__nogw", "dt": "gw", "children": devinfo}]
        else:
            assert False, "Device Info needs gateway or node."

    def __repr__(self):
        return "{}({},{})".format(self.__class__.__name__, str(self._devinfo))

    def __iter__(self):
        self._idx = 0
        return self

    def __next__(self):
        if self._idx >= len(self._devinfo):
            raise StopIteration
        else:
            self._idx += 1
            return self._devinfo[self._idx - 1]
            
    def next(self):
        return self.__next__()

    def _makenodemap(self, node, devtype):
        devmap = {}
        if 'children' in node:
            for dev in node['children']:
                if dev['dt'][:3] == devtype:
                    devmap[dev['id']] = node['id']
        return devmap

    def _getdevmap(self, devtype):
        devmap = {}
        for gw in self._devinfo:
            if gw['dt'] == DevType.GATEWAY:
                if 'children' in gw:
                    for nd in gw['children']:
                        devmap.update(self._makenodemap(nd, devtype))
            elif gw['dt'] == DevType.NODE:
                devmap.update(self._makenodemap(gw, devtype))
            elif gw['dt'][:3] == devtype:
                devmap[gw['id']] = None
        return devmap

    def isok(self):
        if self._devinfo is not None and isinstance(self._devinfo, (list,)) and len(self._devinfo) > 0 and "children" in self._devinfo[0]:
            return True
        return False

    def findgateway(self, nodeid):
        """ 
        노드장비아이디로 게이트웨이 장비정보를 획득한다.
        :param devid: 장비 아이디
        :param lst: 장비정보를 검색할 시점. 전체에 대해 검색한다면 None 으로 하거나 입력하지 않음.
        """
        try:
            if nodeid is None:
                return None

            for gw in self._devinfo:
                for node in gw["children"]:
                    if str(node["id"]) == str(nodeid):
                        print "found gateway", gw
                        return gw
        except Exception as ex:
            print "Fail to find dev by id?", devid, one, ex

    def finddevbyid(self, devid, lst=None):
        """ 
        장비아이디로 장비정보를 획득한다.
        :param devid: 장비 아이디
        :param lst: 장비정보를 검색할 시점. 전체에 대해 검색한다면 None 으로 하거나 입력하지 않음.
        """
        try:
            if lst is None:
                lst = self._devinfo

            for one in lst:
                if str(one["id"]) == str(devid):
                    return one
                elif "children" in one:
                    dev = self.finddevbyid(devid, one["children"])
                    if dev is not None:
                        return dev
        except Exception as ex:
            print "Fail to find dev by id?", devid, one, ex

    def finddevbydevkey(self, devkey, dt, lst=None):
        """ 
        장비키와 장비타입으로 장비정보를 획득한다.
        :param devkey: 장비키
        :param dt: 장비타입
        :param lst: 장비정보를 검색할 시점. 전체에 대해 검색한다면 None 으로 하거나 입력하지 않음.
        """
        try:
            if lst is None:
                lst = self._devinfo

            for one in lst:
                if str(one["dk"]) == str(devkey) and DevType.issameclass(one["dt"], dt):
                    return one
                elif "children" in one:
                    dev = self.finddevbydevkey(devkey, dt, one["children"])
                    if dev is not None:
                        return dev
        except Exception as ex:
            print "Fail to find dev by devkey ?", devkey, dt, ex

    def findid(self, devkey, dt, lst=None):
        dev = self.finddevbydevkey(devkey, dt, lst)
        if dev is None:
            return None
        return dev["id"]

    def getgw(self, idx=0):
        return self._devinfo[idx]

if __name__ == "__main__":
    devinfo = DevInfo([
      {"id" : "3", "dk" : "1", "dt": "nd", "children" : [
        {"id" : "4", "dk" : "0", "dt": "sen"},
        {"id" : "5", "dk" : "1", "dt": "sen"},
        {"id" : "6", "dk" : "2", "dt": "act"},
        {"id" : "7", "dk" : "3", "dt": "act/retractable/level0"}
      ]}
    ])

    print "findid", di.findid(0, "sen")
    time.sleep(3)
    mate.stop()
    print "mate stopped"
