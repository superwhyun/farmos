/**
 * Copyright © 2016-2018 JiNong Inc. 
 * All Rights Reserved.
 *
 * 이 모듈은 이벤트를 다루기 위한 API 이다. 주로 JNAlarm 에서 사용한다.
 */

var jsonfile = require('jsonfile');
var conffile = '../../common_api/conf/hasg.json';
var _config = jsonfile.readFileSync(conffile);

var fcore = require('fcore.js')
var fevt = require('fevt.js')
fevt.initialize(_config)


var jnalarm = function () {
    "use strict";
    /**
     * @method _getfunction
     * @param {object} req - Request object
     * @param {object} res - Response object
     * @param {Function} func - function
     * @param {boolean} issingle - if single object should be returned, true.
     * @param {arary} param - parameter for function. array.
     * @description 사용자 아이디만 필요한 펑션이 너무 많아서 이 함수를 사용함.
     */
    var _getfunction = function (req, res, func, issingle = false, param = null) {
        var params = req.swagger.params;
        //console.log(params);
        if ('identifier' in params) {
            fevt.initialize (_config)
            .then (function () {
                if (param === null)
                    return func(params.identifier.value);
                else
                    return func(params.identifier.value, param);
            })
            .then (function (ret) {
                console.log("_getfunction", ret);
                if (issingle)
                    res.json(ret[0]);
                else
                    res.json(ret);
            })
            .catch (function (err) {
                res.status(500).send(err);
            });
        } else {
            res.status(400).send("no parameter.");
        }
    };

    /**
     * @method getconfig
     * @description 사용자 설정을 가져온다.
     */
    var getconfig = function (req, res) {
        return _getfunction (req, res, fevt.getuserconfig, true);
    };

    var setconfig = function (req, res) {
        var params = req.swagger.params;
        if (('identifier' in params) &&
                ('body' in params) && (params.body.value)) {
            var user = params.body.value;
            user.id = params.identifier.value;
            fevt.initialize (_config)
            .then (function () {
                return fevt.setuserconfig(user);
            })
            .then (function (ret) {
                res.json();
            })
            .catch (function (err) {
                res.status(500).send(err);
            });
        } else {
            res.status(400).send("no parameter.");
        }
    };

    var setappconfig = function (req, res) {
        var params = req.swagger.params;
        if (('identifier' in params) &&
                ('body' in params) && (params.body.value)) {
            var app = params.body.value;
            app.id = params.identifier.value;
            console.log("setappconfig", app);
            fevt.initialize (_config)
            .then (function () {
                return fevt.setappconfig(app);
            })
            .then (function (ret) {
                res.json();
            })
            .catch (function (err) {
                console.log(err);
                res.status(500).send(err);
            });
        } else {
            res.status(400).send("no parameter.");
        }
    };

    var getversion = function (req, res) {
        return _getfunction (req, res, fevt.getappversion, true);
    };

    var getthreshold = function (req, res) {
        return _getfunction (req, res, fevt.getthreshold);
    };

    var setthreshold = function (req, res) {
        var params = req.swagger.params;
        console.log(params);
        if (('identifier' in params) &&
                ('body' in params) && (params.body.value)) {
            var threshold = params.body.value;
            var userid = params.identifier.value;
            fevt.initialize (_config)
            .then (function () {
                return fevt.setthreshold (userid, threshold);
            })
            .then (function (ret) {
                console.log(ret);
                res.json();
            })
            .catch (function (err) {
                console.log(err);
                res.status(500).send(err);
            });
        } else {
            res.status(400).send("no parameter.");
        }
    };

    var getobservation = function (req, res) {
        return _getfunction (req, res, fevt.getobservation);
    };

    var getevthistory = function (req, res) {
        return _getfunction (req, res, fevt.geteventhistory, false, [50, 0]);
    };

    var getevtstatus = function (req, res) {
        return _getfunction (req, res, fevt.getevents);
    };
	
    var setevtstatus = function (req, res) {
        var params = req.swagger.params;
        console.log(params);
        if (('identifier' in params) &&
                ('body' in params) && (params.body.value)) {
            var evt = params.body.value;
            var userid = params.identifier.value;
            fevt.initialize (_config)
            .then (function () {
                return fevt.seteventdelay (userid, evt.id, evt.delay);
            })
            .then (function (ret) {
                console.log(ret);
                res.json();
            })
            .catch (function (err) {
                console.log(err);
                res.status(500).send(err);
            });
        } else {
            res.status(400).send("no parameter.");
        }
    };


    return {
        getConfigInfo: getconfig,
        updateConfigInfo: setconfig,
        updateAppInfo: setappconfig,
        getVersionInfo: getversion,
        getThresholdInfo: getthreshold,
        updateThresholdInfo: setthreshold,
        getObservationInfo: getobservation,
        getHistoryInfo: getevthistory,
        getAlarmStatusInfo: getevtstatus,
        setAlarmStatusInfo: setevtstatus
    };
};

module.exports = jnalarm ();

