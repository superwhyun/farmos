#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2019 JiNong, Inc.
# All right reserved.
#

import sys
import time
import importlib
import json
import requests
import pymysql
from datetime import datetime

from daemon import Daemon, Runner
import util
import managers

class FCore(Runner):
    def __init__(self, configfile, logger):
        fp = open(configfile, 'r')
        self._option = json.loads(fp.read())
        fp.close()

        self._conn = None
        self._cur = None
        self._logger = logger
        self._rules = managers.RuleManager(self._option, logger)

    def connect(self):
        copt = self._option["db"]
        self._conn = pymysql.connect(host=copt["host"], user=copt["user"],
                         password=copt["password"], db=copt["db"], cursorclass=pymysql.cursors.DictCursor)
        self._cur = self._conn.cursor()
        self._rules.updatedb(self._conn, self._cur)

    def close(self):
        self._cur.close()
        self._conn.close()

    def stop(self):
        self._logger.info("Try to stop")
        self._isrunning = False

    def run(self, debug=False):
        self.connect()
        self._isrunning = True

        while self._isrunning:
            tmp = datetime.now()

            self._rules.process()

            tmp = self._option["sleep"] - (datetime.now() - tmp).total_seconds()
            print "time left", tmp, self._option["sleep"]
            if tmp > 0:
                time.sleep(tmp)
            if debug:
                break

        self.close()

    
if __name__ == '__main__':
    if len(sys.argv) != 2:
        print "Usage : python fcore.py [start|stop|restart|run|debug]"
        sys.exit(2)

    mode = sys.argv[1]
    runner = FCore('../conf/fcore.json', util.getdefaultlogger())
    adaemon = Daemon('fcore', runner)
    if 'start' == mode:
        adaemon.start()
    elif 'stop' == mode:
        adaemon.stop()
    elif 'restart' == mode:
        adaemon.restart()
    elif 'run' == mode:
        adaemon.run()
    elif 'debug' == mode:
        adaemon.run(True)
    else:
        print "Unknown command"
        sys.exit(2)
    sys.exit(0)
