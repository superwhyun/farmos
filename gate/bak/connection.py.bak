#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2018 JiNong, Inc.
# All right reserved.
#

import sys
import socket
import select
import Queue
import serial
import logging
import logging.handlers
import util

class ReadError(Exception):
    pass

class Connection:
    def __init__(self, option, logger):
        self._option = option
        if logger is None:
            self._logger = util.getdefaultlogger()
        else:
            self._logger = logger
        self._rbuf = ""
        self._wbuf = ""
        if "BBB" in option and option["BBB"] is True:
            import Adafruit_BBIO.UART as UART
            UART.setup("UART1")

    def clear(self):
        self._rbuf = ""
        self._wbuf = ""

    def open(self):
        pass

    def close(self):
        pass

    def available(self):
        return len(self._rbuf) > 0

    def realread(self, n):
        # return n - readsize
        """
        실제 읽는 함수. 
        타임아웃등의 이슈가 생기면 exception을 발생해야함
        """
        pass

    def read(self, n):
        while len(self._rbuf) < n:
            try: 
                self.realread(n - len(self._rbuf))
            except Exception as ex:
                self._logger.warn("msg read " + str(ex))
                self.close()
                self.clear()
                self.open()

        ret = self._rbuf[:n]
        self._rbuf = self._rbuf[n:]
        return ret

    def write(self, buf):
        return True

class TCPClientConnection(Connection):
    _BUFSIZE = 1024

    def realread(self, n):
        try:
            data = self._stream.recv(self._BUFSIZE)
            if data:
                self._rbuf.extend(data)
                return True
            else:
                raise error('Read Error')
        except Exception as ex:
            self._logger.warn("read " + str(ex))
            self.close()
            return False

    def write(self, buf):
        try:
            self._stream.send(buf)
            return True
        except Exception as ex:
            self._logger.warn("write " + str(ex))
            self.close()
            return False

    def open(self):
        pass

    def close(self):
        pass

class TCPServerConnection(Connection):
    def open(self):
        self._conn = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._conn.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._conn.bind(('0.0.0.0', self._option["conn"]["port"]))
        self._conn.listen(10)
        self._inputs = [self._conn]
        self._outputs = []
        self._msgque = {}

    def close(self):
        self._conn.close()

    def _read(self, soc, n):
        self._logger.info("try to read from " + str(soc) + "," + str(n))
        data = soc.recv(n)
        self._logger.info("received data " + str(len(data)))
        if len(data) == n:
            if soc not in self._outputs:
                self._outputs.append(soc)
            return {'soc':soc, 'data' : data}
        else:
            #if soc in self._outputs:
            try:
                self._outputs.remove(soc)
            except:
                pass
            try:
                self._inputs.remove(soc)
            except:
                pass
            try:
                del self._msgque[soc]
            except:
                pass
            try:
                soc.close()
            except:
                pass
            self._logger.info("close. " + str(soc))
            return None

    def read(self, n):
        ret = []
        while self._inputs:
            readable, writable, exceptional = select.select(self._inputs, self._outputs, self._inputs)

            self._logger.info("readable " + str(len(readable)))
            for s in readable:
                if s is self._conn:
                    soc, addr = s.accept()
                    self._logger.info("connected from " + str(soc) + ", " + str(addr))
                    soc.setblocking(0)
                    self._inputs.append(soc)
                    self._msgque[soc] = Queue.Queue()
                       
                else:
                    data = self._read(s, n)
                    if data:
                        ret.append(data)

            for s in writable:
                self._logger.info("writable " + str(s))
                try:
                    next = self._msgque[s].get_nowait()
                except Queue.Empty:
                    self._outputs.remove(s)
                else:
                    self._logger.info("sent " + str(s) + ", " + str(len(next)))
                    s.send(next)

            for s in exceptional:
                self._inputs.remove(s)
                if s in self._outputs:
                    self._outputs.remove(s)
                    s.close()
                    del self._msgque[s]

            if len(ret) > 0:
                return ret
        return None

    def write(self, buf, soc):
        try:
            self._msgque[soc].put(buf)
            return True
        except Exception as ex:
            self._logger.warn ("write " + str(ex))
            return False

class SerialConnection(Connection):
    _deftimeout = 100

    def realread(self, n):
        buf = self._serial.read(n+1)
        if len(buf) > 0:
            self._rbuf = self._rbuf + buf
            print "read : ",
            print "[",
            for ch in buf:
                print ord(ch), " ",
            print "]"
            return n - len(buf)
        raise ReadError("fail to read")

    def write(self, buf):
        return self._serial.write(buf)

    def open(self):
        self._serial = serial.Serial(self._option['port'],
                self._option['baudrate'], timeout=self._option.get('timeout', self._deftimeout))
        if self._serial.isOpen() is False:
            self._serial.open()

    def close(self):
        self._serial.close()

class ETXSerialConnection(SerialConnection):
    def open(self):
        self._serial = serial.Serial(self._option['port'],
                self._option['baudrate'], timeout=self._option.get('timeout', self._deftimeout))
        if self._serial.isOpen() is False:
            self._serial.open()

        if 'ETX' in self._option:
            self._logger.info("skip message until ETX " + self._option['ETX'])
            while True:
                ch = self._serial.read(1)
                if ch == self._option['ETX']:
                    break

    def realread(self, n):
        print n, "realread : ",
        while n > 0:
            ch = self._serial.read(1)
            if len(ch) == 0:
                raise ReadError("fail to read")
            if ch != self._option['ETX']:
                self._rbuf = self._rbuf + ch
                print ch,
                n = n - 1
            else:
                print "[", ch, "]",
                break
        print ""
        return n

if __name__ == "__main__":
    opt = {"port" : "/dev/ttyACM0", "baudrate": 9600, "type":"NUTRI"}
    sc = SerialConnection(opt, None)
    sc.open()
    print sc.read(10)
    sc.close()
