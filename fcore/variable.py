#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2018 JiNong, Inc.
# All right reserved.
#

from datetime import datetime
from code import RetCode

class Variable(object):
    def __init__(self, value=None):
        self._nvalue = value
        self._oldvalue = value
        self._modified = datetime.now()
        self._observed = datetime.now()
        self._updated = False
   
    def __repr__(self):
        return "{}({})".format(self.__class__.__name__, str(self._nvalue))

    def setvalue(self, value):
        if value is None:
            return

        self._oldvalue = self._nvalue
        if value != self._nvalue:
            self._nvalue = value
            self._modified = datetime.now()
        self._observed = datetime.now()
        self._updated = True 

    def setfromdb(self, row):
        """shold be used when it loaded from db"""
        self._nvalue = row['nvalue']
        self._oldvalue = row['nvalue']
        self._modified = row['modified_time']
        self._observed = row['obs_time']
        self._updated = False

    def getvalue(self):
        return self._nvalue

    def gettsvalue(self, tsidx):
        if isinstance(self._nvalue, list):
            return self._nvalue[tsidx]
        return self._nvalue

    def getobserved(self):
        return self._observed

    def getmodified(self):
        return self._modified

    def isupdatedtoday(self):
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        return self._observed >= today

    def getdiff(self):
        return self._nvalue - self._oldvalue

    def getdelta(self, dt):
        return self.getdiff() / dt

    def getintegration(self, dt):
        return self.getdiff() * dt

    def isupdated(self):
        return self._updated
        
    def applied(self):
        self._updated = False

if __name__ == '__main__':
    v = Variable()
    row = {'nvalue' : 3, 'obs_time' : datetime.now(), 'modified_time' : datetime.now()}
    v.setfromdb(row)
    print "isupdatedtoday", v.isupdatedtoday()
    print "getvalue", v.getvalue()
    v.setvalue(5)
    print "gatvalue, getdiff", v.getvalue(), v.getdiff()
