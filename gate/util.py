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

