#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2018 JiNong, Inc.
# All right reserved.
#

"""
    Utility Functions를 정의함.
"""

import time
import math
import logging
import logging.handlers

def getdefaultlogger():
    _logger = logging.getLogger('mate')
    _logger.setLevel(logging.DEBUG)
    streamHandler = logging.StreamHandler()
    formatter = logging.Formatter('[%(levelname)s|%(filename)s:%(lineno)s] %(asctime)s > %(message)s')
    streamHandler.setFormatter(formatter)
    _logger.addHandler(streamHandler)
    return _logger

class SunTime:
    def __init__(self, longitude, latitude):
        self._longitude = longitude * -1
        self._latitude = latitude
        self._today = time.localtime(time.time())

    def settoday(self):
        self._today = time.localtime(time.time())

    def getgamma(self):
        return (2.0 * math.pi / 365.0) * self._today.tm_yday

    def getgamma2(self, hour):
        return (2.0 * math.pi / 365.0) * self._today.tm_yday + (hour/24.0)

    def getequationtime(self, gamma):
        return 229.18 * (0.000075 + 0.001868 * math.cos(gamma) - 0.032077 * math.sin(gamma) - 0.014615 * math.cos(2 * gamma) - 0.040849 * math.sin(2 * gamma))

    def getsolardeclination(self, gamma):
        return 0.006918 - 0.399912 * math.cos(gamma) + 0.070257 * math.sin(gamma) - 0.006758 * math.cos(2 * gamma) + 0.000907 * math.sin(2 * gamma)

    def degtorad(self, deg):
        return math.pi * deg / 180.0

    def radtodeg(self, rad):
        return 180 * rad / math.pi

    def gethourangle(self, latitude, declination, tm):
        latrad = self.degtorad(latitude)
        hourangle = math.acos(math.cos(self.degtorad (90.833)) / (math.cos(latrad) * math.cos(declination))
                                - math.tan(latrad) * math.tan(declination))
        if tm == 1:
            return hourangle
        elif tm == 0:
            return -1 * hourangle
        return 0

    def gettime(self, gamma, isrise):
        eqtime = self.getequationtime(gamma)
        declination = self.getsolardeclination(gamma)
        hourangle = self.gethourangle(self._latitude, declination, 1 if isrise == True else 0)
        delta = self._longitude - self.radtodeg(hourangle)
        return 720.0 + 4.0 * delta - eqtime

    def getsunrise(self):
        tm = self.gettime(self.getgamma (), True)
        #return self.gettime(self.getgamma2(int(tm / 60.0)), True) + 540
        m = self.gettime(self.getgamma2(int(tm / 60.0)), True) + 540
        return int(m * 60)

    def getsunset(self):
        tm = self.gettime(self.getgamma (), False)
        #return self.gettime(self.getgamma2(int(tm / 60.0)), False) + 540
        m = self.gettime(self.getgamma2(int(tm / 60.0)), False) + 540
        return int(m * 60)

if __name__ == '__main__':
    st = SunTime(128.856632, 37.798953)
    print("rise", st.getsunrise(), "set", st.getsunset())
