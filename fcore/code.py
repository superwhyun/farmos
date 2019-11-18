#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2019 JiNong, Inc.
# All right reserved.
#

from enum import IntEnum

class RetCode(IntEnum):
    OK = 0
    NOT_USED = 1
    TRIGGER_NOT_ACTIVATED = 2
    PROCESSOR_EXCEPTION = 3
    UNKNOWN_ERROR = 4
    WRONG_TIMESPAN = 5
    ABNORMAL_DEVICE = 6
