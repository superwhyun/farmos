#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2018 JiNong, Inc.
# All right reserved.
#

import sys
import time
import importlib
import json
import requests
import os
from queue import Queue
from daemon import Daemon, Runner
from mate import Mate
from mblock import MBlock, BlkType
import util

class CoupleManager(Runner):
    _couples = []
    _isrunning = False

    # 경로 설정
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    def __init__(self, configfile, logger):
        fp = open(configfile, 'r')
        self._option = json.loads(fp.read())
        self._logger = logger
        fp.close()
        if 'sleep' not in self._option:
            self._option['sleep'] = 1
        if 'iter' not in self._option:
            self._option['iter'] = 10

    def extractcouples(self, gate):
        if "couples" in self._option:
            couples = []
            for cp in gate["children"]:
                if cp["id"] in self._option["couples"]:
                    couples.append(cp)
        else:
            couples = gate["children"]
        return couples

    def loadcandidates(self):
        try:
            if 'mode' in self._option and self._option['mode'] == 'local':
                fp = open('../conf/localcouple.json', 'r')
                gate = json.loads(fp.read())
                fp.close()
                return self.extractcouples(gate)
        except Exception as ex:
            self._logger.warn("fail to load : " + str(ex))
        return None

    def popmate(self, candy):
        for idx in range(len(self._couples)):
            if self._couples[idx]['id'] == candy['id']:
                return self._couples.pop(idx)
        return None

    def execute(self, candy):
        ssmate = candy['ssmate']
        dsmate = candy['dsmate']
        devinfo = candy['children']
        couple = {}
        couple['id'] = candy['id']
        couple['candy'] = json.dumps(candy)
        couple['ssmate'] = self.loadmate(ssmate, devinfo, candy['id'])
        self._logger.info("A ssmate [" + ssmate["mod"] + "/" + ssmate["class"] + "] is loading.")
        couple['dsmate'] = self.loadmate(dsmate, devinfo, candy['id'])
        self._logger.info("A dsmate [" + dsmate["mod"] + "/" + dsmate["class"] + "] is loading.")
        couple['ssmate'].start(couple['dsmate'].writeblk)
        couple['dsmate'].start(couple['ssmate'].writeblk)
        return couple

    def loadmate(self, conf, devinfo, coupleid):
        module = importlib.import_module(conf['mod'])
        class_ = getattr(module, conf['class'])
        self._logger.info("load a mate : " + str(conf['class']) + " " + str(coupleid))
        mate = class_(conf['opt'], devinfo, coupleid, self._logger)
        return mate

    def stopcouple(self, couple):
        couple['ssmate'].stop()
        couple['dsmate'].stop()
        self._logger.info(couple['id'] + " stopped")

    def stopold(self):
        for couple in self._couples:
            self.stopcouple(couple)

    def stop(self):
        self._logger.info("Couple Manager tries to stop")
        self._isrunning = False

    def run(self, debug=False):
        self._isrunning = True
        i = 0
        while self._isrunning:
            if i % self._option['iter'] == 0:
                newcouples = []
                candidates = self.loadcandidates()
                if candidates is None:
                    self._logger.info("retry to load candidates..." + str(i / self._option['iter']))
                    continue

                for candy in candidates:
                    couple = self.popmate(candy)
                    if couple is None:
                        self._logger.info("A new couple [" + candy["name"] + "] is loading.")
                        couple = self.execute(candy)
                    elif couple['candy'] != json.dumps(candy):
                        self._logger.info("Configuration of a couple [" + candy["name"] + "] is changed.")
                        self.stopcouple(couple)
                        couple = self.execute(candy)
                    newcouples.append(couple)

                self.stopold()
                self._couples = newcouples
                i = 1
            else:
                i = i + 1
            time.sleep(self._option['sleep'])
        self.stopold()

if __name__ == '__main__':
    # if len(sys.argv) != 2:
    #     print("Usage : python couplemanager.py [start|stop|restart|run]")
    #     sys.exit(2)
    # mode = sys.argv[1]
    runner = CoupleManager('../conf/cpmng.conf', util.getdefaultlogger())
    runner.initialize()
    runner.run()
    runner.finalize()    
    
    
    # adaemon = Daemon('cpmng', runner)
    # if 'start' == mode:
    #     adaemon.start()
    # elif 'stop' == mode:
    #     adaemon.stop()
    # elif 'restart' == mode:
    #     adaemon.restart()
    # elif 'run' == mode:
    #     adaemon.run()
    # else:
    #     print "Unknown command"
    #     sys.exit(2)
    # sys.exit(0)
