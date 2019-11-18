#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2018 JiNong, Inc.
# All right reserved.
#

import time
from datetime import datetime
from collections import deque

import sys
sys.path.insert(0, "..")
from result import RetCode
from variable import Variable

def windlet(inputs, pvalues, dbcur):
    """
    inputs : #wdir0, #wdir1, #ghdir
    outputs : rwind, lwind
    """
    rwind = lwind = 0

    newangle = inputs["#wdir1"].getvalue() - inputs["#ghdir"].getvalue() - 45
    print "windlet", newangle
    while 0 > newangle or newangle > 360:
        if newangle < 0:
            newangle = newangle + 360
        if newangle > 360:
            newangle = newangle - 360

    if 0 <= newangle <= 90:
        rwind = 1
    elif 180<= newangle <= 270:
        lwind = 1

    return (RetCode.OK, [rwind, lwind])

def crop(inputs, pvalues, dbcur):
    """
    inputs: #crop, #plantdate
    outputs : stage, period
    stage
      0:휴지기, 1:개화기, 2:비대기, 3:수확기
      11:초기, 12:중기, 17: 말기
      13: 중기1 (9-10), 14: 중기2(11-12), 15:중기3(1-2), 16:중기4(3-6)
    """

    # temporary
    if inputs["#stage"].isupdatedtoday():
        return (RetCode.OK, [None, None])

    if inputs["#plantdate"].getvalue() == 0:
        return (RetCode.OK, [0, 0])
    
    month = datetime.now().month
    diffday = int((time.time() - inputs["#plantdate"].getvalue()) / 86400)
    stage = 0
    if inputs["#crop"].getvalue() == 1:
        if diffday < 30:
            stage = 11
        elif month in (9, 10):
            stage = 13
        elif month in (11, 12):
            stage = 14
        elif month in (1, 2):
            stage = 15
        elif month in (3, 4, 5, 6):
            stage = 16
        elif diffday < 200:
            stage = 12
        else:
            stage = 17

    return (RetCode.OK, [stage, diffday])

if __name__ == '__main__':
    inputs= {"#period": Variable(0), "#stage" : Variable(0), 
        "#plantdate" : Variable(0), "#crop" : Variable(1)}
    ret, pv = crop(inputs, None)
    print "result", pv

    inputs= {"#period": Variable(0), "#stage" : Variable(0), 
        "#plantdate" : Variable(time.time() - 86400 * 10), "#crop" : Variable(1)}
    ret, pv = crop(inputs, None)
    print "result", pv

    inputs= {"#period": Variable(0), "#stage" : Variable(0), 
        "#plantdate" : Variable(time.time() - 86400 * 40), "#crop" : Variable(1)}
    ret, pv = crop(inputs, None)
    print "result", pv





