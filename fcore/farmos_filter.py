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

def movingaverage(inputs, pvalues, dbcur):
    """
    inputs: #sensor0, #sensor1, #number
    outputs : value
    """

    n = inputs["#number"].getvalue()
    v = inputs["#sensor1"].getvalue()
    if pvalues is None or len(pvalues) == 0:
        # first time
        values = [v, deque([v] * n)] 
    else:
        q = pvalues[1]
        q.popleft()
        q.append(v)
        values = [sum(q)*1.0/n, q]

    return (RetCode.OK, values)

def lowpassfilter(inputs, pvalues, dbcur):
    """
    inputs: #sensor0, #sensor1, #weight
    outputs : value
    """

    v = inputs["#sensor1"].getvalue()
    if pvalues is None or len(pvalues) == 0:
        # first time
        values = [v] 
    else:
        w = inputs["#weight"].getvalue()
        p = pvalues[0]
        values = [v * (1 - w) + p * w]

    return (RetCode.OK, values)

def temperatureguide(inputs, pvalues, dbcur):
    """
    inputs: #vtemp, #htemp
    outputs : venttemp, heattemp, stdtemp
    """
    v = inputs["#vtemp"].getvalue()
    h = inputs["#htemp"].getvalue()
    return (RetCode.OK, [v, h, (v + h) / 2.0])

def radaccumulate(inputs, pvalues, dbcur):
    """
    inputs: #outrad0, #outrad1, #accrad
    outputs : acc, day
    """

    day = time.localtime(time.time()).tm_yday
    if pvalues is None or len(pvalues) == 0 or pvalues[1] == day:
        if inputs["#accrad"].isupdatedtoday():
            before = inputs["#accrad"].getvalue()
        else:
            before = 0
    else:
        before = 0

    acc = before + inputs["#outrad1"].getvalue() * 0.0036

    return (RetCode.OK, [acc, day])



if __name__ == '__main__':
    inputs= {"#sensor0" : Variable(0), "#sensor1" : Variable(10), "#number" : Variable(3)}
    ret, pv = movingaverage(inputs, None)
    print "result", pv
    inputs= {"#sensor0" : Variable(0), "#sensor1" : Variable(11), "#number" : Variable(3)}
    ret, pv = movingaverage(inputs, pv)
    print "result", pv
    inputs= {"#sensor0" : Variable(0), "#sensor1" : Variable(12), "#number" : Variable(3)}
    ret, pv = movingaverage(inputs, pv)
    print "result", pv
    inputs= {"#sensor0" : Variable(0), "#sensor1" : Variable(13), "#number" : Variable(3)}
    ret, pv = movingaverage(inputs, pv)
    print "result", pv





