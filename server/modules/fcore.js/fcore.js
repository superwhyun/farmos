/**
 * @fileoverview fcore API
 * @author joonyong.jinong@gmail.com
 * @version 2.0.1
 * @since 2018.05.24
 */

var fs = require('fs');
var path = require('path');
var jsonfile = require('jsonfile');
var jsonpath = require('jsonpath');

var fcore_api = function () {
    var _confdir = null;
    var _config = null;
    var _pool = require('database.js')();
    var _query = "";
    var _initialized = false;
    var _getmodestr = [
        "manual", "to manual", "to auto", "auto",
        "reload then manual", "reload then auto",
        "initialize then manual", "initialize then auto"
    ];
    var _setmodestr = [
        "manual", "auto", "reload", "initialize"
    ];

    /**
     * @method initialize
     * @param {String} confdir - Configuration Directory
     * @description fcore_api 모듈을 초기화 한다.
     */
    var initialize = async function () {}

    /**
     * @method finalize
     * @description fcore_api 모듈사용을 종료한다. 
     */
    var finalize = function (callback) {
        _pool.end (function (err) {
            if (err)
                console.log (err);
        });
    };

    /**
     * @method getmode
     * @description fcore 작동 모드를 확인한다.
     */
    var getmode = function () {
        _query = "select on_ui * 2 + on_hasg as mode from hasg_config";
        return new Promise (function (resolve, reject) {
            _pool.query (_query, function (err, results, fields) {
                if (err) {
                    console.log (err);
                    reject (new Error ("fail to get mode."));
                } else {
                    resolve (_getmodestr[results[0].mode]);
                }
            });
        });
    };

    /**
     * @method setmodeforUI
     * @param {String} modestr - fcore 작동모드 : manual, auto, reload, initialize
     * @description UI에서 fcore 작동모드를 변경한다.
     */
    var setmodeforUI = function (modestr) {
        var idx = _setmodestr.indexOf (modestr.toLowerCase());
        console.log (idx);
        return new Promise (function (resolve, reject) { 
            if (idx < 0) {
                reject (new Error ("modestr is wrong."));
            } else {
                _query = "update hasg_config set on_ui = " + idx;
                _pool.query (_query, function (err, results, fields) {
                    if (err) {
                        console.log (err);
                        reject (new Error ("fail to set mode."));
                    } else {
                        resolve ();
                    }
                });
            }
        });
    };

    /**
     * @method getnextinittime
     * @description 다음번 자동 초기화 시간을 가져온다.
     */
    var getnextinittime = function () {
        _query = "select next_init_time from hasg_config";
        return new Promise (function (resolve, reject) {
            _pool.query (_query, function (err, results, fields) {
                if (err) {
                    console.log (err);
                    reject (new Error ("fail to get next initialization time."));
                } else {
                    resolve (results[0].next_init_time);
                }
            });
        });
    };

    /**
     * @method setnextinittime
     * @param {String} nextinittime
     * @description 다음번 자동 초기화 시간을 세팅한다.
     */
    var setnextinittime = function (nextinittime) {
        _query = "update hasg_config set next_init_time = '" + nextinittime + "'";
        return new Promise (function (resolve, reject) {
            _pool.query (_query, function (err, results, fields) {
                if (err) {
                    console.log (err);
                    reject (new Error ("fail to set next initialization time :" + 
                            nextinittime));
                } else {
                    resolve ();
                }
            });
        });
    };

    /**
     * @method getinterface
     * @description 설정파일에서 interface를 읽는다.
     */
    var getinterface = function () {
        return new Promise (function (resolve, reject) {
            if (_config) {
                resolve (_config.interfaces);
            } else {
                reject (new Error ("fail to get interface. maybe not initialized "));
            }
        });
    };

    /**
     * @method gettimespan
     * @param {String} timespanid
     * @description 타임스팬 정보를 읽는다.
     */
    var gettimespan = function (timespanid) {
        var filename = _config.filter (function (item) {
            return item.id == timespanid;
        });

        return new Promise (function (resolve, reject) {
            if (filename.length > 1)
                reject (new Error ("too many timespan"));
            else if (filename.length < 1)
                reject (new Error ("no timespan"));

            resolve (jsonfile.readFileSync (path.join (_confdir, filename[0])));
        });
    };

    /**
     * @method settimespan
     * @param {String} timespanid
     * @param {String} timespan
     * @description 타임스팬 정보를 읽는다.
     */
    var settimespan = function (timespanid, timespan) {
        var filename = _config.filter (function (item) {
            return item.id == timespanid;
        });

        return new Promise (function (resolve, reject) {
            if (filename.length > 1)
                reject (new Error ("too many timespan"));
            else if (filename.length < 1)
                reject (new Error ("no timespan"));

            jsonfile.writeFileSync (
                path.join (_confdir, filename[0]), timespan, {spaces : 2});
            resolve ();
        });
    };

    /**
     * @method getfile
     * @param {String} filename
     * @description 설정파일을 읽는다.
     */
    var getfile = function (filename) {
        return new Promise (function (resolve, reject) {
            var file = jsonfile.readFileSync (path.join (_confdir, filename));
            if (file)
                resolve (file);
            else
                reject (new Error ("fail to read file : " + filaname));
        });
    };

    /**
     * @method setfile
     * @param {String} filename
     * @param {String} content
     * @description 설정파일을 쓴다.
     */
    var setfile = function (filename, content) {
        return new Promise (function (resolve, reject) {
            jsonfile.writeFileSync (
                path.join (_confdir, filename), content, {spaces : 2});
            resolve ();
        });
    };

    /**
     * @method getdownload
     * @param {String} datestr
     * @param {String} field
     * @description 데이터를 다운로드한다.
     */
    var getdownload = function (datestr, field) {
        var dirname = "/usr/local/hasg/backup";
        var filename = "env_" + (parseInt(field) - 1) + "_" + datestr + ".csv";
        return new Promise (function (resolve, reject) {
            if (fs.existsSync (path.join (dirname, filename))) {
                // file exists 
                var file = fs.readFileSync (path.join (dirname, filename));
                if (file)
                    resolve (file);
                else
                    reject (new Error ("fail to read file : " + filaname));
            } else { // need to generate
                _query = "SELECT times, sensors, thresholds " + 
                "FROM (SELECT 'time' AS times, sensor.names AS sensors, " + 
                " ifnull(threshold.names, '') AS thresholds " + 
                "FROM (SELECT Group_concat(name ORDER BY device_id) AS names " + 
                "FROM gos_devicemap  WHERE  device_id IN ( " + 
                "SELECT b.id FROM gos_devicemap a, gos_devices b " + 
                "WHERE  a.device_id = b.id AND a.field_id IN (1, " + field + 
                ") and b.devtype <> 'actuator' )) sensor, " + 
                "(SELECT Group_concat(name ORDER BY name) AS names " +
                "FROM (SELECT name FROM hasg_value " +
                "WHERE  writetime BETWEEN ( SELECT " +
                "Date_format(Date_add(Now(), INTERVAL -1 day), '%Y-%m-%d 00:00')) " +
                "AND (SELECT Date_format(Now(), '%Y-%m-%d %H:%i')) " +
                "GROUP BY name) thname) threshold) header " +
                "UNION ALL " +
                "SELECT envdata.obstime AS times, envdata.value AS sensors, " +
                "Ifnull(threshold.value, ',,') AS thresholds FROM (" +
                "SELECT obstime, Group_concat(nvalue ORDER BY device_id) value " +
                "FROM (SELECT device_id, " +
                "Date_format(obstime, '%y-%m-%d %H:%i') AS obstime, nvalue " +
                "FROM (select b.device_id, b.obstime , b.nvalue from (" +
                "select b.* from gos_devices a, gos_devicemap b " +
                "where a.id = b.device_id and b.field_id in (1, " + field + ") " +
                "and a.devtype <> 'actuator') a, gos_environment b " +
                "where a.device_id = b.device_id " +
                "and a.field_id in (1, " + field + ") " +
                "and b.obstime between (" + 
                "select date_format(" +
                "date_add(now(), interval -1 day), '%y-%m-%d 00:00')) " +
                "and (select date_format(now() , '%y-%m-%d %H:%i'))) env " +
                "GROUP BY device_id, date_format(obstime, '%y-%m-%d %H:%i'), " +
                "nvalue) envtotal " +
                "GROUP BY obstime) envdata " +
                "LEFT JOIN (SELECT writetime, " +
                "group_concat(value ORDER BY name) value FROM (" +
                "SELECT date_format(writetime, '%y-%m-%d %H:%i') AS writetime, " +
                "avg(value) AS value, name FROM hasg_value " +
                "WHERE writetime BETWEEN (SELECT " +
                "Date_format(Date_add(Now(), INTERVAL -1 day), '%Y-%m-%d 00:00')) " +
                "AND (SELECT Date_format(Now(), '%Y-%m-%d %H:%i')) " +
                "GROUP BY Date_format(writetime, '%y-%m-%d %H:%i'), name) " +
                "threshold GROUP BY writetime) threshold " +
                "ON envdata.obstime = threshold.writetime ";

                _pool.query (_query, function (err, results, fields) {
                    if (err) {
                        console.log (err);
                        reject (new Error ("fail to get environment."));
                    } else {
                        var csv = "";
                        results.forEach (function (row) {
                            csv += row.times + "," + row.sensors + 
                                    "," + row.thresholds + "\n";
                        });
                        resolve (csv);
                    }
                });
            }
        });
    };

    /**
     * @method getrulehistory
     * @description 룰 적용 이력을 읽어온다.
     */
    var getrulehistory = function () {
        _query = "select lastupdated, history from hasg_history";
        return new Promise (function (resolve, reject) {
            _pool.query (_query, function (err, results, fields) {
                if (err) {
                    console.log (err);
                    reject (new Error ("fail to get rule application history."));
                } else {
                    resolve (results[0]);
                }
            });
        });
    };

    /**
     * @method getlastquery
     * @description fcore_api 모듈에서 마지막으로 사용한 쿼리를 보여준다. 이 함수는 테스트용으로 사용된다.
     */
    var getlastquery = function () {
        return _query;
    };

    /**
     * @method _execute
     * @param {String} query - database query
     * @param {Object} param - parameter for query
     * @return Promise 성공시 true
     * @description query와 param을 받아서 실행한다.
     */
    var _execute = function (query, param) {
        console.log("_execute", query, param);
        return new Promise(function (resolve, reject) {
            _pool.getConnection(function(err, conn) {
                if (err) {
                    console.log ("fail to get connection", err);
                    reject(new Error("fail to get db connection"));
                
                } else {
                    conn.query (query, param, function (error, results, fields) {
                        if (error) {
                            _logger.warn ("error : " + query);
                            _logger.warn (error);
                            conn.release();
                            reject(new Error("fail to execute query : " + query));
                        } else {
                            conn.release();
                            resolve (true);
                        }
                    });
                }
            });
        });
    };

    /**
     * @method _executeandresult
     * @param {String} query - database query
     * @param {Object} param - parameter for query
     * @return Promise 성공시 조회결과
     * @description query와 param을 받아서 실행한다.
     */
    var _executeandresult = function (query, param) {
        console.log("_execute&result", query, param);
        return new Promise(function (resolve, reject) {
            _pool.getConnection(function(err, conn) {
                if (err) {
                    console.log ("fail to get connection", err);
                    reject(new Error("fail to get db connection"));
                
                } else { 
                    conn.query(query, param, function (error, results, fields) {
                        if (error) {
                            _logger.warn ("error : " + _query);
                            _logger.warn (error);
                            conn.release();
                            reject(new Error("fail to execute query : " + _query));
                        } else {
                            console.log (results);
                            conn.release();
                            resolve(results);
                        }
                    });
                }
            });
        });
    };

    /**
     * @method getobservation
     * @param {String} userid - 사용자 아이디
     * @return Promise 센서 관측치
     * @description 룰과 관련된 센서의 관측치를 조회한다.
     */
    var getobservation = function (userid) {
        // 사용자의 아이디에 따라 관련 센서의 아이디를 체크해야 하지만 여기서는 패스
        // 이벤트와의 상관관계도 따져야 하는데 여기서는 고정
        var devids = [1001, 1002, 1025, 1026];
        var obs;
        return new Promise (function (resolve, reject) {
            _executeandresult("select c.obstime, c.device_id, c.nvalue, m.name, m.unit from gos_environment_current c, gos_devicemap m where c.device_id = m.device_id and c.device_id in (1001,1002, 1025,1026)")
            .then(function (ret) {
                obs = ret;
                return _executeandresult("select a.device_id from gos_alarm_config a, gos_event e where a.name = e.name and e.processed is null");
            })
            .then(function (ret) {
                resolve(obs.map(function(one) {
                    for (var i = 0; i < ret.length; i++) {
                        if (one.device_id == ret[i].device_id) {
                            one.isgood = false;
                            return one;
                        }
                    }
                    one.isgood = true;
                    return one;
                }));
            })
            .catch(function (err) {
                console.log(err);
                reject(new Error("fail to get observation"));
            });
        });
    };

    /**
     * @method getevents
     * @param {String} userid - 사용자 아이디
     * @return Promise 처리되지 않은 이벤트에 대한 조회결과
     * @description 처리되지 않은 이벤트에 대한 조회를 한다.
     */
    var getevents = function (userid) {
        if (userid == "UI")
            return _executeandresult("select e.id, e.name, e.severity, e.occured, e.updated, e.processed, NULL as delay, c.devids from gos_event e, gos_core_rule_used c where e.rule_id = c.id and e.processed is null");
        else
            return _executeandresult("select e.id, e.name, e.severity, e.occured, e.updated, e.processed, a.delay, c.devids from gos_event e, gos_user_alarm a, gos_core_rule_used c where e.rule_id = c.id and e.processed is null and e.id = a.evt_id and a.user_id = ?", [userid]);
    };

    /**
     * @method geteventhistory
     * @param {String} userid - 사용자 아이디
     * @param {array} param - limit : 개수 제한, offset : 시작번호
     * @return Promise 처리된 이벤트에 대한 조회결과
     * @description 처리된 이벤트에 대한 조회를 한다.
     */
    var geteventhistory = function (userid, param) {
        return _executeandresult("select e.id, e.name, e.severity, e.occured, e.updated, e.processed, c.devids from gos_event e, gos_core_rule_used c where e.rule_id = c.id and e.processed is not null order by processed desc limit ? offset ?", [param[0], param[1]]);
    };

    /**
     * @method getusers
     * @return Promise 사용자 리스트
     * @description 사용자 정보를 조회한다.
     */
    var getusers = function () {
        return _executeandresult("select id, fcm, method, defdelay from gos_alarm_user");
    };

    /**
     * @method _deletealarm
     * @return Promise 성공시 true
     * @description 완료된 이벤트에 대한 알람을 제거한다.
     */
    var _deletealarm = function () {
        return _execute ("delete from gos_user_alarm where evt_id not in (select id from gos_event where processed is null)");
    };

    /**
     * @method _insertalarm
     * @return Promise 성공시 true
     * @description 새로 생성된 이벤트에 대한 알람을 추가한다.
     */
    var _insertalarm = function () {
        return _execute ("insert into gos_user_alarm (user_id, evt_id, delay) (select u.id, e.id, now() from gos_event e, gos_alarm_user u, gos_farm_user f, gos_fields d, gos_core_rule_used c where e.rule_id = c.id and c.field_id = d.id and d.farm_id = f.farm_id and u.id = f.user_id and e.id not in (select evt_id from gos_user_alarm) and e.processed is null)");
    };

    /**
     * @method _getalarms
     * @return Promise 알람을 전송할 리스트
     * @description 알람전송이 필요한 리스트를 조회한다. delay가 null 이면 알람전송예외이다.
     */
    var _getalarms = function () {
        return new Promise (function (resolve, reject) {
            Promise.all ([_deletealarm(), _insertalarm()])
            .then (function (ret) {
                return _executeandresult("select a.user_id, u.fcmkey, u.method, a.evt_id, e.name, e.rule_id, e.severity, a.delay, u.defdelay from gos_alarm_user u, gos_event e, gos_user_alarm a where u.id = a.user_id and e.id = a.evt_id and a.delay < now()");
            })
            .then (function (ret) {
                resolve (ret);
            })
            .catch (function (err) {
                console.log (err);
                reject (new Error("fail to get alarms"));
            });
        });
    };

    /**
     * @method _insertalarmhistory
     * @param {object} one - 하나의 알람
     * @return Promise 성공시 true
     * @description 알람의 전송이력을 남긴다.
     */
    var _insertalarmhistory = function (one) {
        return _execute ("insert into gos_alarm_history(user_id, evt_id, method, message, ret, sent) values (?, ?, ?, ?, ?, now())", [one.user_id, one.evt_id, one.method, one.msg, one.ret? 0: 1]);
    };

    /**
     * @method _updatealarm
     * @param {object} one - 하나의 알람
     * @return Promise 성공시 true
     * @description 알람의 딜레이를 설정한다.
     */
    var _updatealarm = function (one) {
        return _execute ("update gos_user_alarm set delay = ? + INTERVAL ? MINUTE where user_id = ? and evt_id = ?", [one.delay, one.defdelay, one.user_id, one.evt_id]);
    };

    /**
     * @method seteventdelay
     * @param {string} userid - 사용자아이디
     * @param {integer} evtid - event 아이디
     * @param {string} delay - delay datetime string
     * @return Promise 성공시 true
     * @description 알람의 딜레이를 설정한다.
     */
    var seteventdelay = function (userid, evtid, delay) {
        if (delay)
            return _execute ("update gos_user_alarm set delay = ? where user_id = ? and evt_id = ?", [delay, userid, evtid]);
        else
            return _execute ("update gos_user_alarm set delay = NULL where user_id = ? and evt_id = ?", [userid, evtid]);
    };

    /**
     * @method _send
     * @param {object} one - 하나의 알람. method 의 값은 다음과 같음. V:진동 N:사용안함 R:소리 M:문자메세지 K:소리/진동
     * @return Promise 성공시 true
     * @description 하나의 알람을 전송한다.
     */
    var _send = function (one) {
        console.log("send", one);
        if (one.method == "M") {
            return _sendSMS (one);
        } else if (one.method == "N") {
            return _sendNothing (one);
        } else {
            return _sendFCM (one);
        }
    };


    /**
     * @method _sendnupdate
     * @return Promise 성공시 true
     * @description 알람을 전송하고, 디비를 업데이트한다.
     */
    var _sendnupdate = function (one) {
        return new Promise(function (resolve, reject) {
            _send (one)
            .then (function (ret) {
                return _insertalarmhistory (ret);
            })
            .then (function (ret) {
                return _updatealarm (ret);
            })
            .then (function (ret) {
                resolve (ret);
            })
            .catch (function (err) {
                reject (new Error ("fail to process an alarm"));
            });
        });
    };

    /**
     * @method sendalarms
     * @return Promise 성공시 true
     * @description 알람을 전송한다. 전체 알람을 전송하기 때문에 사용시 주의할 필요가 있다.
     */
    var sendalarms = function () {
        return new Promise (function (resolve, reject) {
            _getalarms()
            .then (function (ret) {
                return Promise.all (ret.map (one => _sendnupdate(one)));
            })
            .then (function (ret) {
                resolve (ret);
            })
            .catch (function (err) {
                console.log(err);
                reject(new Error ("fail to send alarms"));
            });
        });
    };
    
    /**
     * @method _sendNothing
     * @param {object} one - 하나의 알람. method 의 값은 다음과 같음. V:진동 N:사용안함 R:소리 M:문자메세지 K:소리/진동
     * @return Promise 성공시 alarm
     * @description 하는 일이 없다. :)
     */
    var _sendNothing = function (one) {
        return new Promise(function(resolve, reject) {
            one.ret = true;
            one.msg = "no message";
            resolve(one);
        });
    };

    /**
     * @method _sendFCM
     * @param {object} one - 하나의 알람. method 의 값은 다음과 같음. V:진동 N:사용안함 R:소리 M:문자메세지 K:소리/진동
     * @return Promise 성공시 alarm
     * @description FCM 알람을 전송한다.
     */
    var _sendFCM = function (one) {
        return new Promise(function(resolve, reject) {
            one.msg = "[알림] " + one.name + " 위험도 : " + one.severity;

            var data = {
                to: one.fcmkey,
                data: one,
                collapse_key: one.name,
                android: { ttl: "86400s"} 
            };

            console.log("_sendFCM", data);

            _fcm.send(data, function(err, response) {
                if (err) {
                    one.ret = false;
                    one.msg = "Push메시지 발송에 실패했습니다. " + err;
                    console.error('Push메시지 발송에 실패했습니다.', err);
                    //reject (new Error ("fail to send FCM"));
                } else {
                    one.ret = true;
                }
                resolve (one);
            });
        });
    };

    /**
     * @method _sendSMS
     * @param {object} one - 하나의 알람. method 의 값은 다음과 같음. V:진동 N:사용안함 R:소리 M:문자메세지 K:소리/진동
     * @return Promise 성공시 alarm
     * @description SMS 알람을 전송한다.
     */
    var _sendSMS = function (one) {
        var options = _config.sms;
        options.form.receiver = one.user_id;
        options.form.msg = one.msg = "[알림] " + one.name + " 위험도 : " + one.severity;
        one.ret = false;

        return new Promise (function (resolve, reject) {
            console.log("send SMS", options);
            //*
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body);
                    var ret = JSON.parse(body);
                    if (ret.success_cnt == 1) {
                        one.ret = true;
                    } else {
                        one.msg = "fail to send SMS";
                        console.log ("fail to send SMS");
                        //reject(new Error("fail to send"));
                    }
                } else {
                    one.msg = "fail to send SMS (http fail)";
                    console.log ("fail to send SMS (http fail)");
                    //reject(new Error("fail to send (http fail)"));
                }
                resolve(one);
            });
            //*/
        });
    };

    /** 
     * @method getappversion
     * @return Promise app version 정보
     * @description app version을 확인한다.
     */
    var getappversion = function () {
        return _executeandresult("select newest_version newest_app_version, minimum_version minimum_support_app_version from gos_app where name = 'JNAlarm' "); 
    };

    /** 
     * @method getuserconfig
     * @param {String} userid - 사용자 아이디
     * @return Promise 사용자 설정 정보
     * @description 사용자 설정을 확인한다.
     */
    var getuserconfig = function (userid) {
        return _executeandresult("select defdelay, method from gos_alarm_user where id = ? ", [userid]);
    };

    /** 
     * @method setuserconfig
     * @param {object} user - 사용자 설정
     * @return Promise 사용자 설정 정보
     * @description 사용자 설정을 세팅한다.
     */
    var setuserconfig = function (user) {
        return _execute("update gos_alarm_user set defdelay = ?, method = ? where id = ? ", [user.defdelay, user.method, user.id]);
    };

    /** 
     * @method getappconfig
     * @param {String} userid - 사용자 아이디
     * @return Promise 사용자 설정 정보
     * @description 사용자 설정을 확인한다.
     */
    var getappconfig = function (userid) {
        return _executeandresult("select fcmkey, appversion from gos_alarm_user where id = ? and id in (select id from gos_farm_user where id = ?)", [userid, userid]);
    };

    /** 
     * @method _adduser
     * @param {object} user - 사용자 정보
     * @return Promise 
     * @description  사용자를 추가한다.
     */
    var _adduser = function (user) {
        return new Promise (function (resolve, reject) {
            _execute("insert into gos_alarm_user(id, fcmkey, appversion) values (?, ?, ?)", [user.id, user.fcmkey, user.appversion])
            .then(function (ret) {
                return _execute("insert into gos_alarm_used(user_id, name, used) (select ?, name, true from gos_alarm_used where user_id = 'UI')", [user.id]);
            })
            .then(function (ret) {
                resolve();
            })
            .catch(function(err) {
                reject(new Error("fail to add user."));
            });
        });
    };

    /** 
     * @method setappconfig
     * @param {object} user - 사용자 설정
     * @return Promise 사용자 설정 정보
     * @description 사용자 설정을 세팅한다.
     */
    var setappconfig = function (user) {
        return new Promise(function (resolve, reject) {
            getappconfig(user.id)
            .then(function (users) {
                if (users.length === 0) {    
                    console.log("add a new user");
                    return _adduser(user);
                } else {
                    console.log("upate app config");
                    return _execute("update gos_alarm_user set fcmkey = ?, appversion = ? where id = ? ", [user.fcmkey, user.appversion, user.id]);
                }
            })
            .then(function(ret) {
                resolve ();
            })
            .catch(function(err) {
                console.log(err);
                reject(new Error("fail to set app config."));
            });
        });
    };


    /** 
     * @method _onethreshold
     * @param {string} fname - file name
     * @param {string} jpath - json path
     * @param {number} value - value
     * @return Promise threshold value
     * @description 하나의 임계치를 읽거나 쓴다.
    var _onethreshold = function (one) {
        console.log("onethreshold", one);
        return new Promise (function (resolve, reject) {
            var data = jsonfile.readFileSync("/root/hasg/conf/rule/" + one.fname);
            var threshold;
            if (one.value) {
                threshold = jsonpath.value(data, one.jpath, String(one.value));
                jsonfile.writeFileSync("/root/hasg/conf/rule/" + one.fname, data, {spaces: 2, EOL: '\n'});
            } else {
                threshold = jsonpath.value(data, one.jpath);
            }
            one.value = threshold;
            resolve(one);
        });
    };
     */

    /** 
     * @method _readthreshold
     * @param {object} row - 하나의 alarm config
     * @return Promise ..
     * @description 한 단위의 임계치를 읽는다.
    var _readthreshold = function (row) {
        return new Promise (function (resolve, reject) {
            Promise.all([_onethreshold(row.fname1, row.jpath1),
                    _onethreshold(row.fname2, row.jpath2)])
            .then(function(ret) {
                console.log("thresholds from file", ret);
                resolve({
                    pname: row.pname,
                    thresholds: [{
                        name: row.name1, value: ret[0]
                    }, {
                        name: row.name2, value: ret[1]
                    }]
                });
            })
            .catch(function(err) {
                console.log(err);
                reject(new Error("fail to read threshold."));
            });
        });
    };
     */


    /** 
     * @method _writethreshold
     * @param {object} row - 하나의 alarm config
     * @param {object} one - 하나의 threshold
     * @return Promise ..
     * @description 임계치를 설정파일에 기록한다.
    var _writethreshold = function (row, one) {
        return new Promise (function (resolve, reject) {
            Promise.all([_onethreshold(row.fname1, row.jpath1, one.thresholds[0].value),
                    _onethreshold(row.fname2, row.jpath2, one.thresholds[1].value)])
            .then(function (ret) {
                resolve();
            })
            .catch(function(err) {
                reject(new Error("fail to write threshold."));
            });
        });
    };
     */


    /** 
     * @method getthreshold
     * @param {string} userid - 사용자 ID
     * @return Promise 임계치 설정
     * @description 임계치 설정 정보를 확인한다.
     */
    var getthreshold = function (userid) {
        return new Promise (function (resolve, reject) {
            _executeandresult("select u.field_id, u.name pname, p.name, p.value, u.used from gos_core_rule_param p, gos_core_rule_used u where u.id = p.rule_id and u.field_id in (select id from gos_fields where farm_id in (select farm_id from gos_farm_user where user_id = ?)) order by field_id, pname, name", [userid])
            .then (function (ret) {
                var idxmap = {};
                resolve (ret.reduce(function (r, a) {
                    var idx = idxmap[a.pname] || -1;
                    if (idx >0) {
                        r[idx-1].thresholds.push({
                            name: a.name, value: Number(a.value)
                        });
                    } else {
                        r.push({
                            pname: a.pname, used: a.used >0, thresholds: [{ 
                                name: a.name, value: Number(a.value)
                            }]
                        });
                        idxmap[a.pname] = r.length;
                    };
                    return r;
                }, []));
            })
            .catch(function(err) {
                console.log(err);
                reject(new Error("fail to get threshold."));
            });
        });
    };

    var _writethreshold = function (ruleid, name, value) {
        return _execute("update gos_core_rule_param set value = ? where rule_id = ? and name = ?", [value, ruleid, name]);
    };

    var _writethresholdused = function (ruleid, pname, used) {
        return _execute("update gos_core_rule_used set used = ? where id = ? and name = ?", [used, ruleid, pname]);
    };

    /** 
     * @method setthreshold
     * @param {string} userid - 사용자 ID
     * @param {object} threshold - 임계치설정
     * @return Promise 
     * @description 임계치를 설정한다.
     */
    var setthreshold = function (userid, threshold) {
        var ruleid;
        return new Promise (function (resolve, reject) {
            _executeandresult("select id from gos_core_rule_user where user_id = ? and name = ?", [userid, threshold.pname])
            .then (function (ret) {
                console.log(ret);
                ruleid = ret[0].id;
                return _writethresholdused(ruleid, threshold.pname, threshold.used);
            })
            .then (function (ret) {
                return Promise.all(threshold.thresholds.map(function (one) {
                    return _writethreshold(ruleid, one.name, one.value);
                }));
            })
            .then (function (ret) {
                return _execute("update hasg_config set on_ui = 2");
            })
            .then (function (ret) {
                console.log(ret);
                resolve(ret);
            })
            .catch(function(err) {
                console.log(err);
                reject(new Error("fail to set threshold."));
            });
        });
    };

    /** 13dd
     * @method _template
     * @param {object} one - 하나의 알람
     * @return Promise ..
     * @description ...
     */
    var _template = function (one) {
        var options = _config.sms;
        return new Promise (function (resolve, reject) {
            resolve();
        });
    };

    return {
        initialize : initialize,
        finalize : finalize,
        getmode : getmode,
        setmodeforUI : setmodeforUI,
        getnextinittime : getnextinittime,
        setnextinittime : setnextinittime,
        getinterface : getinterface,
        gettimespan : gettimespan,
        settimespan : settimespan,
        getfile : getfile,
        setfile : setfile,
        getrulehistory : getrulehistory,
        getevents: getevents,
        seteventdelay: seteventdelay,
        geteventhistory: geteventhistory,
        //getusers: getusers,
        sendalarms: sendalarms,
        getappversion: getappversion,
        getuserconfig: getuserconfig,
        setuserconfig: setuserconfig,
        getappconfig: getappconfig,
        setappconfig: setappconfig,
        getthreshold: getthreshold,
        setthreshold: setthreshold,
        getobservation: getobservation,
        getlastquery : getlastquery
    };
};

module.exports = fcore_api();
