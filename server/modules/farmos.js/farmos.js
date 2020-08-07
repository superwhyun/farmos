/**
 * @fileoverview FARMOS_BETA Javascript API
 * @author joonyong.jinong@gmail.com
 * @version 1.0.0
 * @since 2017.07.04
 */

var localcoupleFile = '../../conf/localcouple.json'
var codeJs = require('./code.js')
const axios = require('axios')
const jsonfile = require('jsonfile')

var farmos_api = function () {
    var _pool = require('database.js')();
    var _query = "";

    /**
     * @method getfields
     * @description 농장내 구역정보를 모두 읽는다. 
     */
    var getfields = async () => {
        _query = "select id,farm_id, name, fieldtype,uiinfo from fields where deleted = 0";
        const [rows] = await _pool.query(_query)

        let fields = rows
        for (const field of fields) {
            field.data = {}
            _query = "select * from dataindexes join current_observations on dataindexes.id = current_observations.data_id " +
                "where dataindexes.field_id = ? ";
            const [rows] = await _pool.query(_query, [field.id])
            for (const row of rows) {
                let item = {
                    id: row.id,
                    name: row.name,
                    value: Number(row.nvalue)
                }

                if (field.id * 100000 + 1 === item.id) {
                    field.data['lat'] = item
                } else if (field.id * 100000 + 2 === item.id) {
                    field.data['lng'] = item
                } else if (field.id * 100000 + 3 === item.id) {
                    field.data['crop'] = item
                }
                else if (field.id * 100000 + 4 === item.id) {
                    item.value = date_to_str(new Date(item.value * 1000))
                    field.data['plantdate'] = item
                }

            }

        }
        return fields
    };

    /**
     * @method setfield
     * @param {Integer} fldid - field id
     * @param {Object} field - field information
     * @description 농장내 구역별정보를 수정한다.
     */
    var setfield = async (fldid, item) => {
        const connection = await _pool.getConnection(async conn => conn);
        try {
            await connection.beginTransaction();

            const cropInfo = JSON.stringify(item.cropinfo)
            _query = "update fields set name = ? where id = ?";
            await connection.query(_query, [item.name, fldid]);

            let codeLat = (fldid * 100000 + 1).toString().padStart(8, '0')
            let codeLng = (fldid * 100000 + 2).toString().padStart(8, '0')
            let codeCrop = (fldid * 100000 + 3).toString().padStart(8, '0')
            let codePlantDate = (fldid * 100000 + 4).toString().padStart(8, '0')

            _query = "update current_observations set obs_time = now(), modified_time = now(), nvalue = ? where data_id = ? ";

            await connection.query(_query, [item.data.lat.value, codeLat]);
            await connection.query(_query, [item.data.lng.value, codeLng]);

            if (item.data.crop) {
                await connection.query(_query, [item.data.crop.value, codeCrop]);
            }

            if (item.data.plantdate && new Date(item.data.plantdate.value) instanceof Date && !isNaN(new Date(item.data.plantdate.value))) {
                await connection.query(_query, [Math.floor(new Date(item.data.plantdate.value).getTime() / 1000.0), codePlantDate]);
            }
            await connection.commit();
        }
        catch (error) {
            await connection.rollback();
            console.log(error)
            throw (error);
        } finally {
            connection.release();
        }
    };

    /**
     * @method deletefield
     * @param {Object} field - field information
     * @description 농장내 구역정보를 삭제한다.
     */
    var deletefield = async (id) => {
        const connection = await _pool.getConnection(async conn => conn);
        try {
            _query = "select count(*)count from device_field where field_id = ?";
            const [result] = await _pool.query(_query, [id])

            if (result[0].count === 0) {
                _query = "update fields set deleted = 1 where id = ?";
                await _pool.query(_query, [id])

                _query = "update dataindexes set deleted = 1 where field_id = ?";
                await _pool.query(_query, [id])

                _query = "update core_rule_applied set deleted = 1 where field_id = ?";
                await _pool.query(_query, [id])
            } else {
                return false
            }
            await connection.commit();
            return true
        }
        catch (error) {
            await connection.rollback();
            throw (error);
        } finally {
            connection.release();
        }
    }

    /**
     * @method addfield
     * @param {Object} field - field information
     * @description 농장내 구역별정보를 수정한다.
     */
    var addfield = async (item) => {

        const connection = await _pool.getConnection(async conn => conn);
        try {
            await connection.beginTransaction();
            let id = 0;
            if (item.fieldtype === 'local') {
                _query = "select count(id) count from fields where fieldtype = 'local'";
                const [rows] = await connection.query(_query)
                if (rows[0].count > 0) {
                    return
                }
            } else {
                id = 1;
                _query = "select max(id) id from fields";
                const [rows] = await connection.query(_query)
                if (rows[0].id) {
                    id = rows[0].id + 1
                }
            }

            const uiInfo = JSON.stringify({
                "index": {
                    "local": {
                        "isFull": true,
                        "idfmt": {
                            "device": "",
                            "data": ""
                        },
                        "max": "max",
                        "device": {},
                        "data": []
                    },
                    "greenhouse": {
                        "isFull": true,
                        "idfmt": {
                            "device": "",
                            "data": ""
                        },
                        "max": "max",
                        "device": {},
                        "data": []
                    },
                    "actuator": {
                        "isFull": true,
                        "idfmt": {
                            "device": "",
                            "data": ""
                        },
                        "max": "max",
                        "device": {},
                        "data": []
                    }
                },
                "dashboard": {
                    "ventilation": {
                        "idfmt": {
                            "device": "",
                            "data": ""
                        },
                        "max": 1,
                        "device": {},
                        "data": []
                    },
                    "heating": {
                        "idfmt": {
                            "device": "",
                            "data": ""
                        },
                        "max": 1,
                        "device": {},
                        "data": []
                    },
                    "temp": {
                        "idfmt": {
                            "device": "1[0-9][0-9][0-9][0-9][0-9][0-9]1",
                            "data": ""
                        },
                        "max": 2,
                        "device": {},
                        "data": [],
                        "isFull": false
                    },
                    "retractable": {
                        "type": {
                            "select": "time",
                            "list": [
                                "time",
                                "ratio"
                            ]
                        },
                        "time": {
                            "max": 5,
                            "idfmt": {
                                "device": "1[0-9][0-9][0-9][0-9][0-9][0-9]4",
                                "data": ""
                            },
                            "device": {},
                            "data": [],
                            "isFull": false
                        },
                        "ratio": {
                            "max": 5,
                            "idfmt": {
                                "device": "1[0-9][0-9][0-9][0-9][0-9][0-9]2",
                                "data": ""
                            },
                            "device": {},
                            "data": [],
                            "isFull": false
                        }
                    },
                    "switch": {
                        "max": 5,
                        "idfmt": {
                            "device": "1[0-9][0-9][0-9][0-9][0-9][0-9]4",
                            "data": ""
                        },
                        "device": {},
                        "data": [],
                        "isFull": false
                    }
                }
            })
            const cropInfo = JSON.stringify(item.cropinfo)

            _query = "insert into fields " +
                "(id,name,fieldtype,uiinfo,farm_id) " +
                "values (?, ?, ?, ?, ?)";
            let [rows] = await connection.query(_query, [id, item.name, item.fieldtype, uiInfo, 1]);

            _query = "INSERT INTO dataindexes (id,name,unit,field_id) "
                + "values (?, ?, ?, ?) ";


            let codeLat = (id * 100000 + 1).toString().padStart(8, '0')
            let codeLng = (id * 100000 + 2).toString().padStart(8, '0')
            let codeCrop = (id * 100000 + 3).toString().padStart(8, '0')
            let codePlantDate = (id * 100000 + 4).toString().padStart(8, '0')
            await connection.query(_query, [codeLat, '위도', '', id]);
            await connection.query(_query, [codeLng, '경도', '', id]);
            await connection.query(_query, [codeCrop, '작물', '', id]);
            await connection.query(_query, [codePlantDate, '정식일', '', id]);

            _query = "INSERT INTO current_observations (data_id,obs_time,nvalue,modified_time) "
                + "values (?, now(), ?, now()) ";


            await connection.query(_query, [codeLat, item.latitude]);
            await connection.query(_query, [codeLng, item.longitude]);
            await connection.query(_query, [codeCrop, item.cropinfo.crop]);
            await connection.query(_query, [codePlantDate, Math.floor(new Date(item.cropinfo.plantdate).getTime() / 1000.0)]);

            _query = "select * from core_timespan where field_id = -1 ";
            const [timeSpanList] = await connection.query(_query);

            _query = "INSERT INTO core_timespan (id,field_id,timespan,name) "
                + "values (?, ?, ?, ?) ";
            for (const timespan of timeSpanList) {
                await connection.query(_query, [timespan.id, id, timespan.timespan, timespan.name]);
            }

            _query = "SELECT * from core_rule_template where autoapplying = 1 ";
            const [autoRuleTemplateList] = await connection.query(_query);

            for (const obj of autoRuleTemplateList) {
                if (obj.constraints) {
                    obj.constraints = JSON.parse(obj.constraints)
                }
                if (obj.configurations) {
                    obj.configurations = JSON.parse(obj.configurations)
                }
                if (obj.inputs) {
                    obj.inputs = JSON.parse(obj.inputs)
                }
                if (obj.outputs) {
                    obj.outputs = JSON.parse(obj.outputs)
                }
                if (obj.controllers) {
                    obj.controllers = JSON.parse(obj.controllers)
                }
                addruleapplied(obj, id)
            }

            await connection.commit();
        }
        catch (error) {
            await connection.rollback();
            throw (error);
        } finally {
            connection.release();
        }
    };

    /**
     * @method setfieldUiDevice
     * @param {Array} fldid - field id
     * @param {Array} path - ui path
     * @param {Array} device - ui device
     * @description 필드 ui 장비 수정한다.
     */
    var setfieldUiDevice = async (fldid, path, devices, datas, typeSelect) => {

        _query = "select uiinfo from fields where id = ? ";
        let [rows] = await _pool.query(_query, [fldid]);

        const uiInfo = JSON.parse(rows[0].uiinfo)
        let newInfo = uiInfo
        for (let index = 0; index < path.length; index++) {
            newInfo = newInfo[path[index]]
        }
        if (devices) {
            newInfo.device = devices
            newInfo.isFull = false
        }
        if (datas) {
            newInfo.data = datas
            newInfo.isFull = false
        }

        if (typeSelect) {
            newInfo.select = typeSelect
        }

        _query = "update fields set uiinfo = ? where id = ?";
        await _pool.query(_query, [JSON.stringify(uiInfo), fldid]);
        return uiInfo
    };

    /**
     * @method getlastobservationsforfield
     * @param Integer fieldid - fieldid
     * @description 특정 농장 구역에 설치된 장비들의 최근 관측치를 확인한다.
     */
    var getlastobservationsforfield = async (fieldid) => {
        _query = "select c.obstime, c.device_id, c.nvalue, m.name, m.unit, " +
            " IFNULL(a.name, '') parent " +
            "from gos_environment_current c, gos_devicemap m " +
            "LEFT JOIN ( select p.device_id, m.name " +
            "from gos_devicemap m, gos_device_portmap p " +
            "where p.channel = m.device_id " +
            "and p.name in ('motor', 'actuator')) a " +
            "on a.device_id = m.device_id " +
            "where m.field_id in (0, ?) and " +
            "c.device_id = m.device_id ";

        const [rows] = await _pool.query(_query, [fieldid]);
        return rows
    };

    /**
     * @method getlastobservations
     * @description 전체 농장 구역에 설치된 장비들의 최근 관측치를 확인한다.
     */
    var getlastobservations = async () => {
        _query = "select * from current_observations join dataindexes on current_observations.data_id = dataindexes.id";
        const [rows] = await _pool.query(_query);
        return rows
    };

    /**
     * @method getobservationsforgraph
     * @param {Array[Integer]} devids - array of device ids
     * @description 그래프로 그리기 위해서 장비들의 관측치를 확인한다.
     */
    var getobservationsforgraph = async (devids) => {
        _query = "select map.name, map.device_id, map.unit, " +
            "time_to_sec(env.obstime) obstime, env.nvalue " +
            "from gos_devicemap map, " +
            "(select device_id, obstime, nvalue from gos_environment " +
            //"where device_id in (" + devids.join(',') + ") and " +
            "where device_id in (?) and " +
            "DATE_FORMAT(obstime, '%Y-%m-%d') = DATE_FORMAT(now(), '%Y-%m-%d') " +
            "and MINUTE(obstime) % 10 = 0) env " +
            "where map.device_id = env.device_id";

        console.log(_query);
        const [rows] = await _pool.query(_query, [devids]);

        var obs = {};
        if (rows.length > 0) {
            rows.map(function (result) {
                if (!(result.device_id in obs)) {
                    obs[result.device_id] = {
                        "name": result.name,
                        "unit": result.unit,
                        "data": [{
                            "time": result.obstime,
                            "value": result.nvalue
                        }]
                    };
                } else {
                    obs[result.device_id].data.push({
                        "time": result.obstime,
                        "value": result.nvalue
                    });
                }
            });
            return obs
        } else {
            throw (new Error("there is no observation for graph."));
        }
    };



    /**
     * @method getfieldswitches
     * @param {Integer} fieldid - field id
     * @description 특정 구역의 스위치 정보를 얻는다.
     */
    var getfieldswitches = async (fieldid) => {
        _query = "select dev.id device_id, dev.devtype, dev.subtype, " +
            "map.name, e.worktime " +
            "from gos_devices dev, gos_devicemap map, " +
            "( select p.channel, e.nvalue worktime " +
            "from gos_device_portmap p, gos_environment_current e " +
            "where p.device_id = e.device_id and p.name = 'actuator') e " +
            "where dev.id = map.device_id " +
            "and e.channel = dev.id and map.field_id = ? " +
            "and dev.subtype != 'dc motor' " +
            "and dev.devtype in ('actuator', 'iactuator')";

        const [rows] = await _pool.query(_query, [fieldid]);
        return rows
    };

    /**
     * @method getfieldmotors
     * @param {Integer} fieldid - field id
     * @description 특정 구역의 개폐기 정보를 얻는다.
     */
    var getfieldmotors = async (fieldid) => {
        _query = "select dev.id device_id, dev.devtype, dev.subtype, " +
            "map.name, e.worktime, e.position, e.lasttime, " +
            "case e.direction when 1 then 'open' when 2 then 'close' " +
            "else 'stop' end direction, e.target, po.propvalue*1 opentime, " +
            "pc.propvalue*1 closetime " +
            "from gos_devices dev, gos_devicemap map, gos_device_properties po, " +
            "gos_device_properties pc, " +
            "(select channel, substring_index(val,',', 1)*1 worktime, " +
            "substring_index(substring_index(val,',', 2),',', -1)*1 position, " +
            "substring_index(substring_index(val,',', 3),',', -1)*1 lasttime, " +
            "substring_index(substring_index(val,',', 4),',', -1) direction, " +
            "substring_index(substring_index(val,',', 5),',', -1)*1 target " +
            "from ( select p.channel, " +
            "group_concat(e.nvalue order by e.device_id asc) val " +
            "from gos_device_portmap p, gos_environment_current e " +
            "where p.device_id = e.device_id and p.name = 'motor' " +
            "group by p.channel) e) e  " +
            "where dev.id = map.device_id and e.channel = dev.id " +
            "and map.field_id = ? and po.device_id = dev.id  " +
            "and po.propkey = 'opentime' and pc.device_id = dev.id " +
            "and pc.propkey = 'closetime' " +
            "and dev.devtype in ('actuator', 'iactuator')";

        const [rows] = await _pool.query(_query, [fieldid]);
        return rows
    };

    /**
     * @method getfieldactuators
     * @param {Integer} fieldid - field id
     * @description 특정 구역의 구동기 정보를 얻는다.
     */
    var getfieldactuators = async (fieldid) => {
        _query = "select dev.id device_id, dev.devtype, dev.subtype, " +
            "map.name, map.unit, e.worktime, e.position, e.lasttime " +
            "from gos_devices dev, gos_devicemap map, " +
            "(select FORMAT(FLOOR(e1.device_id / 10),0) pid, " +
            "e1.nvalue worktime, e2.nvalue position, e3.nvalue lasttime " +
            "from gos_environment_current e1 " +
            "LEFT JOIN gos_environment_current e2 " +
            "on e1.device_id = e2.device_id - 1 " +
            "LEFT JOIN gos_environment_current e3 " +
            "on e1.device_id = e3.device_id - 2 " +
            "WHERE e1.device_id % 10 = 1 and e1.device_id in " +
            "(select device_id from gos_devicemap where field_id = ?)) e " +
            "where dev.id = map.device_id " +
            "and e.pid = dev.id and map.field_id = ? " +
            "and dev.devtype in ('actuator', 'iactuator')";

        const [rows] = await _pool.query(_query, [fieldid, fieldid]);
        return rows
    };

    /**
     * @method getdeviceproperties
     * @param {Integer} devid - device id
     * @description 장비의 속성 정보를 얻는다.
     */
    var getdeviceproperties = async (devid) => {
        _query = "select propkey, propvalue from gos_device_properties " +
            "where device_id = ?";
        const [rows] = await _pool.query(_query, [devid]);
        return rows
    };

    /**
     * @method setdeviceproperties
     * @param {Integer} devid - device id
     * @param {Array[Property]} properties - [{"propkey" : "key", "propvalue" : "value"}]
     * @description 장비의 속성 정보를 업데이트한다.
     */
    var setdeviceproperties = async (devid, properties) => {
        var tmpquery = null;
        var arg = null;
        if (properties.length > 0) {
            var i;
            tmpquery = "insert into gos_device_properties(propkey, propvalue) " +
                "values (?, ?) ";
            arg = [properties[0].propkey, properties[0].propvalue];

            for (i = 1; i < properties.length; i++) {
                tmpquery += tmpquery + ", (?, ?)";
                arg.push(properties[i].propkey);
                arg.push(properties[i].propvalue);
            }
        }
        const connection = await _pool.getConnection(async conn => conn);
        try {
            _query = "delete from gos_device_properties where device_id = ?";
            await connection.beginTransaction();
            await _pool.query(_query, [devid]);
            if (tmpquery !== null) {
                _query = tmpquery;
                await _pool.query(_query, arg);
            }
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw (new Error("fail to set device properties."));
        } finally {
            connection.release();
        }
    };

    /**
     * @method getsensor
     * @param {Integer} devid - device id
     * @description 센서의 속성을 가져온다.
     */
    var getsensor = async (devid) => {
        _query = "select ctype, configuration, offset from gos_device_convertmap " +
            "where device_id = ?";
        const [rows] = await _pool.query(_query, [devid]);
        return rows
    };

    /**
     * @method getvirtualsensor
     * @param {Integer} devid - device id
     * @description 가상 센서의 속성을 가져온다.
     */
    var getvirtualsensor = async (devid) => {
        _query = "select convert.configuration as name, port.channel as sensor, " +
            "port.name as argument, port.opt as option " +
            "from gos_device_convertmap convert, gos_device_portmap port " +
            "where convert.device_id = ? and convert.device_id = port.device_id";

        const [rows] = await _pool.query(_query, [devid]);
        return rows
    };

    /**
     * @method getgraph
     * @param {Array[Integer]} devids - array of device ids
     * @param {string} startdate - start datetime for query
     * @param {string} enddate - end datetime for query
     * @param {boolean} detail - if it needs detail data then true
     * @description 그래프를 그리기 위한 데이터를 획득한다.
     */
    var getgraph = async (devids, startdate, enddate, detail) => {
        var args = [];

        _query = "select a.name as name, a.id as id, a.unit as unit, a.device_id as device_id, " +
            " TIME_TO_SEC(e.obs_time) + DATEDIFF(e.obs_time, ?) * 86400 obs_time, " +
            " e.nvalue as nvalue, devices.name as dname from (dataindexes a left join devices on devices.id = a.device_id), (" +
            " select data_id, obs_time, nvalue from observations " +
            /* " where data_id in (?) and MINUTE(obs_time) % 10 = 0 and obs_time >= ?" + */
            " where data_id in (?) and obs_time >= ?" +
            " and obs_time < ? - INTERVAL 60 MINUTE union all " +
            " select data_id, obs_time, nvalue from observations " +
            " where data_id in (?) and obs_time >= ? - INTERVAL 60 MINUTE " +
            " and obs_time < ? ) e " +
            " where a.id = e.data_id " +
            " order by data_id, obs_time asc";
        args = [startdate, devids, startdate, enddate, devids, enddate, enddate];

        console.log(_pool.format(_query, args));

        const [rows] = await _pool.query(_query, args);
        var graphdata = [];
        var devid = -1;
        var data = null;

        for (var i in rows) {
            var row = rows[i];
            if (devid != row.id) {
                if (data !== null) {
                    console.log(data);
                    graphdata.push(data);
                }

                data = {
                    "id": row.id,
                    "name": row.name,
                    "dname": row.dname,
                    "unit": row.unit,
                    "data": [{
                        "time": row.obs_time.toString(),
                        "value": row.nvalue
                    }]
                };
                devid = row.id;
            } else {
                data.data.push({
                    "time": row.obs_time.toString(),
                    "value": row.nvalue
                });
            }
        }
        if (data !== null) {
            console.log(data);
            graphdata.push(data);
        }
        return graphdata;
    };

    /**
     * @method getgraphall
     * @param {Array[Integer]} devids - array of device ids
     * @param {string} startdate - start datetime for query
     * @param {string} enddate - end datetime for query
     * @description 상세 그래프 데이터를 획득한다.
     */
    var getgraphall = async (devids, startdate, enddate) => {
        _query = "select a.name as name, a.device_id as device_id, a.unit as unit, " +
            " TIME_TO_SEC(e.obstime) + DATEDIFF(e.obstime, ?) * 86400 obstime, " +
            " e.nvalue as nvalue from gos_devicemap a, " +
            " (select device_id, obstime, nvalue from gos_environment " +
            " where device_id in (?) and obstime >= ?" +
            " and obstime < ? " +
            " union all " +
            " select device_id, obstime, nvalue from gos_environment_" +
            startdate.substring(0, 4) + startdate.substring(5, 7) +
            " where device_id in (?) and obstime >= ?" +
            " and obstime < ? " +
            " ) e where a.device_id = e.device_id " +
            " order by device_id, obstime asc";

        const [rows] = await _pool.query(_query, [startdate, devids, startdate, enddate, devids, startdate, enddate]);
        var graphdata = [];
        var devid = -1;
        var data = null;

        for (var i in rows) {
            var row = rows[i];
            if (devid != row.device_id) {
                if (data !== null) {
                    console.log(data);
                    graphdata.push(data);
                }

                data = {
                    "device_id": row.device_id,
                    "name": row.name,
                    "unit": row.unit,
                    "data": [{
                        "time": row.obstime,
                        "value": row.nvalue
                    }]
                };
                devid = row.device_id;
            } else {
                data.data.push({ "time": row.obstime, "value": row.nvalue });
            }
        }
        if (data !== null) {
            graphdata.push(data);
        }
        return graphdata;
    };

    /**
     * @method getdailygraph
     * @param {Array[Integer]} devids - array of device ids
     * @param {string} startdate - 검색 시작일
     * @param {string} enddate - 검색 종료일
     * @param {string} func - group function 을 지정
     * @description daily 그래프를 그리기 위한 데이터를 획득한다.
     */
    var getdailygraph = async (devids, startdate, enddate, func) => {
        _query = "select a.name as name, a.device_id as device_id, a.unit as unit, " +
            " e.obstime, e.nvalue as nvalue from gos_devicemap a, " +
            " (select device_id, date_format(obstime, '%Y-%m-%d') as obstime, " +
            func + " (nvalue) as nvalue from gos_environment " +
            " where device_id in (?) and obstime >= ?" +
            " and obstime < ? group by device_id, date_format(obstime, '%Y-%m-%d') " +
            " union all select device_id, date_format(obstime, '%Y-%m-%d') as obstime, " +
            func + " (nvalue) as nvalue from gos_environment_" +
            startdate.substring(0, 4) + startdate.substring(5, 7) +
            " where device_id in (?) and obstime >= ?" +
            " and obstime < ? group by device_id, date_format(obstime, '%Y-%m-%d')) e " +
            " where a.device_id = e.device_id " +
            " order by device_id, obstime asc";
        console.log(_query);

        const [rows] = await _pool.query(_query, [devids, startdate, enddate, devids, startdate, enddate]);
        var graphdata = [];
        var devid = -1;
        var data = null;

        for (var i in rows) {
            var row = rows[i];
            if (devid != row.device_id) {
                if (data !== null)
                    graphdata.push(data);
                data = {
                    "device_id": row.device_id,
                    "name": row.name,
                    "unit": row.unit,
                    "data": [{
                        "time": row.obstime,
                        "value": row.nvalue
                    }]
                };
                devid = row.device_id;
            } else {
                data.data.push({ "time": row.obstime, "value": row.nvalue });
            }
        }
        if (data !== null)
            graphdata.push(data);

        return graphdata;
    };

    /**
     * @method getcondensation
     * @param Integer devid - device id
     * @param Float threshold - 결로 상황에 대한 임계치
     * @description 그래프를 그리기 위해 당일의 결로 상황을 확인한다. 이 메소드는 정확히 안맞을 수 있으니 확인이 필요하다. ^^;;;
     */
    var getcondensation = async (devid, threshold) => {
        _query = "select min(TIME_TO_SEC(obstime)) as x1, " +
            " max(TIME_TO_SEC(obstime)) as x2 from gos_environment " +
            " where device_id = ? and nvalue < ? and " +
            " DATE_FORMAT(obstime, '%Y-%m-%d') = DATE_FORMAT(now(), '%Y-%m-%d') " +
            " order by obstime asc";

        const [rows] = await _pool.query(_query, [devid, threshold]);
        if (rows[0].x1 === null || rows[0].x2 === null) {
            return []
        } else {
            return [
                { "time": rows[0].x1, "value": 0 },
                { "time": rows[0].x2, "value": 0 }
            ]
        }
    };

    /**
     * @method _geteventcond
     * @description 이벤트 정보 조회를 위한 조건식을 만든다.
     */
    var _geteventcond = function (option) {
        var param = [];
        var where = "";
        var limit = "limit 5";

        if (option !== null && Object.keys(option).length !== 0) {
            console.log("keys", Object.keys(option).length);
            if (option.field_id) {
                where = where + "and e.field_id in (?) ";
                param.push(option.field_id);
            }
            if (option.startdate) {
                where = where + "and e.occured >= ? ";
                param.push(option.startdate);
            }
            if (option.enddate) {
                where = where + "and e.occured < ? ";
                param.push(option.enddate);
            }

            if (option.checked === false)
                where = where + "and d.checked is null ";
            else if (option.checked === true)
                where = where + "and d.checked is not null ";

            if (option.method) {
                where = where + "and d.method in (?) ";
                param.push(option.method);
            }
            if (option.limit) {
                limit = "limit ?";
                param.push(option.limit);
            }
        }

        where = where + "and d.method = 'UI'";

        return [where, param, limit];
    };

    /**
     * @method getevents
     * @description 농장내 이벤트정보를 읽는다. 
     */
    var getevents = async (option) => {
        var cond = _geteventcond(option);

        _query = "select d.id, e.occured, e.field_id, e.severity, e.name, " +
            " d.senttime, IFNULL(d.checked, '') checked, d.contact, d.message, d.method " +
            " from gos_event e, gos_event_delivery d " +
            " where e.id = d.event_id " + cond[0] +
            " order by e.occured desc, e.id desc " + cond[2];

        const [rows] = await _pool.query(_query, cond[1]);
        return rows
    };

    /**
     * @method geteventcnt
     * @description 농장내 이벤트정보 개수를 읽는다. 
     */
    var geteventcnt = async (option) => {
        var cond = _geteventcond(option);

        _query = "select count(*) cnt " +
            " from gos_event e, gos_event_delivery d " +
            " where e.id = d.event_id " + cond[0];

        const [rows] = await _pool.query(_query, cond[1]);
        return rows
    };

    /**
     * @method checkevent
     * @description 농장내 이벤트정보를 확인했다고 표시한다.
     */
    var checkevent = async (eventid) => {
        var param = [eventid];

        _query = "update gos_event_delivery set checked=now() where id = ?";
        await _pool.query(_query, param);
    };

    /**
     * @method getfarm
     * @description 농장 정보를 얻는다. 
     */
    var getfarm = async () => {
        _query = "select id, name, info from farm";
        const [rows] = await _pool.query(_query);
        return rows
    };

    /**
     * @method setfarm
     * @description 농장 정보를 추가 or 수정한다.
     */
    var setfarm = async (item) => {
        /* _query = "insert into farm(id,name,address,postcode,telephone,owner,maincrop)" +
            "values (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, address = ?," +
            "postcode = ?, telephone = ?, owner = ?, maincrop = ?";
        await _pool.query(_query, [1, item.name, item.address, item.postcode, item.telephone, item.owner, item.maincrop, item.name, item.address, item.postcode, item.telephone, item.owner, item.maincrop]); */
        _query = "insert into farm(id,name,info)" +
            "values (?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, info = ?"
        await _pool.query(_query, [1, item.name, JSON.stringify(item.info), item.name, JSON.stringify(item.info)]);
    };

    /**
     * @method getuser
     * @param {Object} user 
     * @description 사용자 정보를 가져온다.
     */
    var _getuser = async (userid, passwd) => {
        _query = "select userid,";
        _query += "privilege,basicinfo from farmos_user ";
        _query += "where userid = '" + userid;
        _query += "' and passwd = password('" + passwd + "')";

	console.log(_query);



        const [rows] = await _pool.query(_query);
        return rows
    };

    /**
     * @method login
     * @param {Object} user 
     * @description 사용자 로그인을 수행한다.
     */
    var login = async (userid, passwd) => {
        const users = await _getuser(userid, passwd)
        if (users.length != 1) {
            throw (new Error("fail to login user"));
        } else {
            return users[0];
        }
    };

    /**
     * @method logout
     * @param {String} userid
     * @description 사용자 로그아웃을 수행한다.
     */
    var logout = async (userid) => {

    };

    /**
     * @method updateuser
     * @param {Object} user 
     * @description 사용자 업데이트를 수행한다.
     */
    var updateuser = async (user) => {
        _query = "update hasg_user set ";
        _query += "firstname = '" + user.firstname + "',";
        _query += "lastname = '" + user.lastname + "',";
        _query += "phone = '" + user.phone + "',";
        _query += "email = '" + user.email + "',";
        if ("newpasswd" in user)
            _query += "passwd = password('" + user.newpasswd + "') ";
        _query += "where userid = '" + user.userid;
        _query += "' and passwd = password('" + user.passwd + "')";

        await _pool.query(_query);
        return await _getuser(user)[0]
    };

    /**
     * @method setdevice
     * @description farmos_api 장비를 수정 한다
     */
    var setdevice = async (devices) => {

        const connection = await _pool.getConnection(async conn => conn);
        try {
            await connection.beginTransaction();

            for (const device of devices) {
                _query = "update devices set name = ? where id = ?"
                await connection.query(_query, [device.name, device.id]);
                _query = "delete from device_field where device_id = ?"
                await connection.query(_query, [device.id]);

                _query = "INSERT INTO device_field ( device_id, field_id, sort_no) values (?, ?, ?)"

                for (const [index, place] of device.place.entries()) {
                    await connection.query(_query, [device.id, place, index + 1]);
                }

            }
            await connection.commit();
        } catch (error) {
            throw error;
            await connection.rollback();
        } finally {
            connection.release();
        }
    }

    /**
     * @method deletedevice
     * @description farmos_api 장비를 삭제 한다
     */
    var deletedevice = async (devices) => {

        let isSuccess = true
        let queryResult = []
        const connection = await _pool.getConnection(async conn => conn);
        try {
            await connection.beginTransaction();
            for (const device of devices) {
                //_query = "select count(*)count from device_field where device_id = ?";
                _query = "delete from device_field where device_id = ? "
                await _pool.query(_query, [device.id])
                _query = "update devices set deleted = 1, updated = now() where id = ?"
                await connection.query(_query, [device.id]);
            }

            const cvtgate = await getgateinfo()
            const data = jsonfile.readFileSync(localcoupleFile)
            //const { data } = await axios.get(`${config.cvgateIp}/gate/${cvtgate.uuid}/couple`)

            for (const device of devices) {
                for (const couple of data['children']) {
                    if (couple.id === device.coupleid) {
                        for (const gateway of couple.children) {
                            if (gateway.id === device.gateid) {
                                for (const node of gateway.children) {
                                    if (device.devindex === null) {
                                        if (device.id.toString() === node.id) {
                                            gateway.children.splice(gateway.children.indexOf(node), 1);
                                            break
                                        }
                                    } else {
                                        for (const sensor of node.children) {
                                            if (sensor.id === device.id.toString()) {
                                                node.children.splice(node.children.indexOf(sensor), 1);
                                                break
                                            }
                                        }
                                    }
                                }
                                break
                            }
                        }
                        break
                    }
                }
            }

            for (const couple of data['children']) {
                if (couple.id === cvtgate.couple) {
                    for (i = couple.children.length - 1; i >= 0; --i) {
                        if (couple.children[i].children.length === 0) {
                            couple.children.splice(i, 1);
                        }
                    }
                    break
                }
            }
            
            jsonfile.writeFileSync(localcoupleFile, data)

            /* let sendData = null
            
            for (const couple of data) {
                if (couple.id === cvtgate.couple) {
                    sendData = couple
                    break;
                }
            }
            if (sendData !== null) {
                //await axios.put(`${config.cvgateIp}/gate/${cvtgate.uuid}/couple/${cvtgate.couple}`, sendData)
                let coupleFile = jsonfile.readFileSync(localcoupleFile)
                
                jsonfile.writeFileSync(localcoupleFile, sendData)
            } else {
                throw new Error();
            } */
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            isSuccess = false
        } finally {
            connection.release();
            return { result: isSuccess, list: queryResult }
        }
    }

    /**
     * @method addDataIndex
     * @description 장비 추가시 CommSpec 에 따라 dataindex를 추가한다
     */
    var addDataIndex = async (connection, id, spec) => {

        for (const item of spec.CommSpec['KS-X-3267:2018'].read.items) {
            let dataId = 1 * 10000000 + id * 100
            _query = "INSERT INTO dataindexes (id,name,unit,sigdigit,device_id) values (?, ?, ?, ?, ?) ";
            switch (item) {
                case 'status':
                    await connection.query(_query, [dataId, '상태', '상태', 2, id]);
                    _query = "INSERT INTO current_observations (data_id,obs_time,nvalue) values (?, now(),?) ";
                    await connection.query(_query, [dataId, 0]);
                    break;
                case 'value':
                    dataId += 1
                    await connection.query(_query, [dataId, '관측치', codeJs.getValueCode(spec.ValueUnit), spec.hasOwnProperty('SignificantDigit') ? spec.SignificantDigit : 2, id]);
                    _query = "INSERT INTO current_observations (data_id,obs_time,nvalue) values (?, now(),?) ";
                    await connection.query(_query, [dataId, 0]);
                    break;
                case 'position':
                    dataId += 2
                    await connection.query(_query, [dataId, '개폐율', '%', 2, id]);
                    _query = "INSERT INTO current_observations (data_id,obs_time,nvalue) values (?, now(),?) ";
                    await connection.query(_query, [dataId, 0]);
                    break;
                case 'state-hold-time':
                    dataId += 3
                    await connection.query(_query, [dataId, '지속시간', 's', 2, id]);
                    _query = "INSERT INTO current_observations (data_id,obs_time,nvalue) values (?, now(),?) ";
                    await connection.query(_query, [dataId, 0]);
                    break;
                case 'remain-time':
                    dataId += 4
                    await connection.query(_query, [dataId, '작동남은시간', 's', 2, id]);
                    _query = "INSERT INTO current_observations (data_id,obs_time,nvalue) values (?, now(),?) ";
                    await connection.query(_query, [dataId, 0]);
                    break;
                case 'ratio':
                    dataId += 5
                    await connection.query(_query, [dataId, '동작강도', '%', 2, id]);
                    _query = "INSERT INTO current_observations (data_id,obs_time,nvalue) values (?, now(),?) ";
                    await connection.query(_query, [dataId, 0]);
                    break;
                case 'control':
                    dataId += 6
                    await connection.query(_query, [dataId, '제어권', '', 2, id]);
                    _query = "INSERT INTO current_observations (data_id,obs_time,nvalue) values (?, now(),?) ";
                    await connection.query(_query, [dataId, 0]);
                    break;
                case 'area':
                    dataId += 7
                    await connection.query(_query, [dataId, '관수구역', '', 2, id]);
                    _query = "INSERT INTO current_observations (data_id,obs_time,nvalue) values (?, now(),?) ";
                    await connection.query(_query, [dataId, 0]);
                    break;
                case 'alert':
                    dataId += 8
                    await connection.query(_query, [dataId, '경보', '', 2, id]);
                    _query = "INSERT INTO current_observations (data_id,obs_time,nvalue) values (?, now(),?) ";
                    await connection.query(_query, [dataId, 0]);
                    break;
            }
        }
    }

    /**
     * @method adddevices
     * @description farmos_api 장비 추가 한다.
     */
    var adddevices = async (devices) => {
        let connection;
        try {
            const nodeList = devices.reduce((nodes, currentObject) => {
                if (currentObject.devindex === undefined) {
                    currentObject.children = []
                    nodes.push(currentObject)
                } else {
                    for (const node of nodes) {
                        if (node.coupleid == currentObject.coupleid && node.gateid == currentObject.gateid && node.nodeid == currentObject.nodeid) {
                            node.children.push(currentObject)
                            break
                        }
                    }
                }
                return nodes
            }, [])

            connection = await _pool.getConnection(async conn => conn);
            await connection.beginTransaction();
            for (const node of nodeList) {
                _query = 'select * from devices where nodeid = ? and gateid = ? and coupleid = ? and devindex is null and deleted = 0'
                let [rows] = await connection.query(_query, [node.nodeid, node.gateid, node.coupleid])
                if (rows.length > 0) {
                    if (rows[0].compcode !== node.compcode || rows[0].devcode !== node.devcode) {
                        _query = "update devices set deleted = 1 where nodeid = ?";
                        await connection.query(_query, [node.nodeid]);
                    }
                }
                _query = "INSERT INTO devices ( name, nodeid, compcode, devcode, devindex, spec, gateid, coupleid ) select  ?, ?, ?, ?, ?, ?, ?, ?"
                    + "FROM (SELECT count(id) as count FROM devices "
                    + "WHERE nodeid = ? AND compcode = ? AND devcode = ? AND gateid = ? AND coupleid = ?  AND devindex is null  AND deleted = 0) a where a.count = 0 "
                let [rows2] = await connection.query(_query, [node.name, node.nodeid, node.compcode, node.devcode, node.devindex, JSON.stringify(node.spec), node.gateid, node.coupleid
                    , node.nodeid, node.compcode, node.devcode, node.gateid, node.coupleid]);

                if (rows2.affectedRows === 1) {
                    addDataIndex(connection, rows2.insertId, node.spec)
                }

                for (const device of node.children) {
                    _query = 'select * from devices where nodeid = ? and gateid = ? and devindex = ? and coupleid = ? and deleted = 0'
                    let [rows] = await connection.query(_query, [device.nodeid, device.gate, device.devindex, device.coupleid])
                    if (rows.length > 0) {
                        if (rows[0].compcode !== device.compcode || rows[0].devcode !== device.devcode) {
                            _query = "update devices set deleted = 1 where id = ?";
                            await connection.query(_query, [rows[0].id]);
                        }
                    }
                    _query = "INSERT INTO devices ( name, nodeid, compcode, devcode, devindex, spec, gateid , coupleid) select  ?, ?, ?, ?, ?, ?, ?, ?"
                        + "FROM (SELECT count(id) as count FROM devices "
                        + "WHERE nodeid = ? AND compcode = ? AND devcode = ? AND devindex = ? AND gateid = ? AND coupleid = ? AND deleted = 0) a where a.count = 0 "
                    let [rows2] = await connection.query(_query, [device.name, device.nodeid, device.compcode, device.devcode, device.devindex, JSON.stringify(device.spec), device.gateid, device.coupleid
                        , device.nodeid, device.compcode, device.devcode, device.devindex, device.gateid, device.coupleid]);

                    if (rows2.affectedRows === 1) {
                        addDataIndex(connection, rows2.insertId, device.spec)
                        for (const [index, place] of device.place.entries()) {
                            _query = "INSERT INTO device_field ( device_id,field_id,sort_no ) values (?, ?, ?) "
                            await connection.query(_query, [rows2.insertId, place, index + 1]);
                        }
                    }
                }
            };

            const cvtgate = await getgateinfo()

            _query = 'select * from devices where deleted = 0 and coupleid = ?'
            let [rows] = await connection.query(_query, [cvtgate.couple])

            const cvtListTemp = rows.reduce((gates, currentItems) => {
                if (gates.filter(gate => gate.id === currentItems.gateid).length === 0) {
                    gates.push({ id: currentItems.gateid, dt: "gw", dk: currentItems.gateid, opt: {}, children: [], devTempList: [] })
                }

                for (const gate of gates) {
                    if (gate.id === currentItems.gateid) {
                        let dkTemp = []
                        const spec = JSON.parse(currentItems.spec)
                        if (spec.CommSpec["KS-X-3267:2018"].read) {
                            dkTemp.push(currentItems.nodeid)
                            dkTemp.push(spec.CommSpec["KS-X-3267:2018"].read["starting-register"])
                            dkTemp.push(`[${spec.CommSpec["KS-X-3267:2018"].read.items.map(x => '"' + x + '"')}]`)
                        } if (spec.CommSpec["KS-X-3267:2018"].write) {
                            dkTemp.push(spec.CommSpec["KS-X-3267:2018"].write["starting-register"])
                            dkTemp.push(`[${spec.CommSpec["KS-X-3267:2018"].write.items.map(x => '"' + x + '"')}]`)
                        }

                        let dt = ""
                        if (spec.Class === 'node') {
                            dt = "nd"
                        }
                        else if (spec.Class === 'sensor') {
                            dt = "sen"
                        } else if (spec.Class === 'actuator' || spec.Class === 'nutrient-supply') {
                            dt = `act/${spec.Type}`
                        }

                        let deviceTemp = {
                            nid: currentItems.nodeid,
                            id: currentItems.id.toString(),
                            dk: `[${dkTemp.toString()}]`,
                            dt: dt,
                            children: []
                        }
                        if (dt === 'nd') {
                            gate.children.push(deviceTemp)
                        } else {
                            gate.devTempList.push(deviceTemp)
                        }
                        break
                    }
                }
                return gates
            }, [])

            cvtListTemp.map(gate => {
                gate.devTempList.map(dev => {
                    for (const node of gate.children) {
                        if (node.nid === dev.nid) {
                            delete dev.nid
                            node.children.push(dev)
                            break;
                        }
                    }
                })
                delete gate.devTempList
            })

            cvtListTemp.map(gate => {
                gate.children.map(node => {
                    delete node.nid
                })
            })

            //await axios.put(`${config.cvgateIp}/gate/${cvtgate.uuid}/couple/${cvtgate.couple}/children`, cvtListTemp)

            const localcoupleFileJson = jsonfile.readFileSync(localcoupleFile)

            for (const couple of localcoupleFileJson['children']) {
                if(couple.id === cvtgate.couple) {
                    couple.children = cvtListTemp
                }
            }

            jsonfile.writeFileSync(localcoupleFile, localcoupleFileJson)
            await connection.commit();
        } catch (error) {
            console.log(error)
            await connection.rollback();
            throw error
        } finally {
            connection.release();
        }
    };

    /**
         * @method getdevices
         * @description 전체 장비 리스트를 가져온다
         */
    var getdevices = async () => {
        let deviceList = []
        _query = "SELECT*,("
            + "SELECT id FROM devices WHERE a.coupleid=devices.coupleid AND a.gateid=devices.gateid AND a.nodeid=devices.nodeid AND devindex IS NULL AND deleted=0) nid FROM ("
            + "SELECT id,name,spec,gateid,coupleid,nodeid,compcode,devcode,devindex,devices.deleted,updated FROM devices WHERE devices.deleted=0) a "
        const [rows] = await _pool.query(_query);
        for (const row of rows) {
            _query = `select * from dataindexes where id like ?`
            const [rows2] = await _pool.query(_query, [100000 + row.id + `__`]);
            row.datas = rows2

            _query = "select field_id from device_field where device_id = ? order by sort_no asc"
            const [rows3] = await _pool.query(_query, [row.id]);
            row.place = rows3.map(field => field.field_id)
        }
        return rows
    };

    /**
     * @method setdevicemanual
     * @description 수동장비 동기화
     */
    var setdevicemanual = async () => {
        const connection = await _pool.getConnection(async conn => conn);
        try {
            await connection.beginTransaction();
            const cvtgate = await getgateinfo()

            _query = 'select * from devices where coupleid != ?'
            let [legacyDevices] = await connection.query(_query, [cvtgate.couple])
            //console.log(legacyDevices)

            //const { data } = await axios.get(`${config.cvgateIp}/gate/${cvtgate.uuid}/couple`)

            const data = jsonfile.readFileSync(localcoupleFile)

            for (const couple of data['children']) {
                if (couple.id !== cvtgate.couple) {
                    const coupleid = couple.id
                    for (const gate of couple.children) {
                        const gateid = gate.id
                        for (const node of gate.children) {
                            for (const [index, legacy] of legacyDevices.entries()) {
                                if (legacy.coupleid === coupleid && legacy.gateid === gateid && legacy.nodeid.toString() === node.id && legacy.devcode.toString() === node.id) {
                                    legacyDevices.splice(index, 1);
                                }
                            }
                            _query = 'select * from devices where coupleid = ? and gateid = ? and nodeid = ? and devcode = ? and devindex is null and deleted = 0'
                            let [rows] = await connection.query(_query, [coupleid, gateid, node.id, node.id])
                            if (rows.length === 0) {
                                _query = "INSERT INTO devices ( coupleid, gateid, nodeid, compcode, devcode, name, spec) value(?, ?, ?, ?, ?, ?, ?)"
                                let [rows2] = await connection.query(_query, [coupleid, gateid, node.id, 0, node.id, "", "{}"]);
                                if (rows2.affectedRows === 1) {
                                    _query = "INSERT INTO dataindexes (id,name,unit) values (?, ?,?) ";
                                    await connection.query(_query, [`1${rows2.insertId.toString().padStart(5, '0')}00`, '상태', '상태']);

                                    _query = "INSERT INTO current_observations (data_id,obs_time,nvalue) values (?, now(),?) ";
                                    await connection.query(_query, [`1${rows2.insertId.toString().padStart(5, '0')}00`, 0]);
                                }
                            } else {
                                _query = "update devices set spec = ? where id = ?"
                                await connection.query(_query, ['{"babo1" : "babo"}', rows[0].id]);
                            }

                            for (const [devindex, device] of node.children.entries()) {

                                for (const [index, legacy] of legacyDevices.entries()) {
                                    if (legacy.coupleid === coupleid && legacy.gateid === gateid && legacy.nodeid.toString() === node.id && legacy.devcode.toString() === device.id) {
                                        legacyDevices.splice(index, 1);
                                    }
                                }

                                _query = 'select * from devices where coupleid = ? and gateid = ? and nodeid = ? and devcode = ? and deleted = 0'
                                let [rows3] = await connection.query(_query, [coupleid, gateid, node.id, device.id])
                                if (rows3.length === 0) {
                                    _query = "INSERT INTO devices ( coupleid, gateid, nodeid, compcode, devcode, devindex, name,spec) value(?, ?, ?, ?, ?, ?, ?, ?)"
                                    let [rows4] = await connection.query(_query, [coupleid, gateid, node.id, 0, device.id, devindex, "", "{}"]);

                                    if (rows4.affectedRows === 1) {
                                        _query = "INSERT INTO dataindexes (id,name,unit) values (?, ?,?) ";
                                        await connection.query(_query, [`1${rows4.insertId.toString().padStart(5, '0')}00`, '상태', '상태']);

                                        _query = "INSERT INTO current_observations (data_id,obs_time,nvalue) values (?, now(),?) ";
                                        await connection.query(_query, [`1${rows4.insertId.toString().padStart(5, '0')}00`, 0]);
                                    }
                                } else {
                                    _query = "update devices set devindex = ?, spec = ? where id = ?"
                                    await connection.query(_query, [devindex, '{"babo2" : "babo"}', rows3[0].id]);
                                }
                            }
                        }
                    }
                    for (const legacy of legacyDevices) {
                        _query = "delete from devices  where id = ?"
                        await connection.query(_query, [legacy.id]);
                    }
                }
            }

            console.log(legacyDevices)
            await connection.commit();
        } catch (error) {
            console.log(error)
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    };

    /**
     * @method getFieldDevices
     * @description 구역별 장비 리스트를 가져온다
     */
    var getfielddevices = async (fieldId) => {
        let deviceList = []
        _query = "SELECT*,("
            + "SELECT id FROM devices WHERE a.coupleid=devices.coupleid AND a.gateid=devices.gateid AND a.nodeid=devices.nodeid AND devindex IS NULL AND deleted=0) nid FROM ("
            + "SELECT id,name,spec,gateid,coupleid,nodeid,compcode,devcode,devindex,devices.deleted,updated,device_id,field_id FROM devices JOIN device_field ON devices.id=device_field.device_id WHERE device_field.field_id= ? AND devices.deleted=0) a "
        const [rows] = await _pool.query(_query, [fieldId]);
        for (const row of rows) {
            _query = `select * from dataindexes where id like ?`
            const [rows2] = await _pool.query(_query, [100000 + row.id + `__`]);
            row.datas = rows2

            _query = "select field_id from device_field where device_id = ?"
            const [rows3] = await _pool.query(_query, [row.id]);
            row.place = rows3.map(field => field.field_id)
        }
        return rows
    };

    /**
     * @method getnodedevices
     * @description 해당 노드 아이디에 속한 장비 리스트를 가져온다
     */
    var getnodedevices = async (coupleId, gateId, nodeId) => {
        let deviceList = []
        const nid = nodeid.split(',').map(Number)
        _query = "select id,name,nodeid,compcode,devcode,devindex,spec,gate from "
            + " devices where deleted = 0 and nodeid in (?) and gateid = ? and coupleid = ? "
        const [rows] = await _pool.query(_query, [nid, gateId, nodeId]);
        for (const row of rows) {
            _query = "select field_id from device_field where device_id = ?"
            const [rows2] = await _pool.query(_query, [row.id]);
            row.place = rows2.map(field => field.field_id)
        }
        deviceList = rows
        return deviceList
    };

    /**
     * @method getruletemplate
     * @description 룰 템플릿 리스트를 가져온다
     */
    var getruletemplate = async () => {
        _query = "select * from core_rule_template"
        const [rows] = await _pool.query(_query);
        deviceList = rows
        return deviceList
    };

    /**
    * @method addruletemplate
    * @description 룰 템플릿 을 추가한다
    */
    var addruletemplate = async (rule) => {
        _query = "INSERT INTO core_rule_template (name,groupname,autoapplying,constraints,configurations,controllers,outputs) "
            + "values (?,?,?,?,?,?,?) ";
        let [rows] = await _pool.query(_query, [rule.name, rule.groupname, rule.autoapplying, JSON.stringify(rule.constraints), JSON.stringify(rule.configurations), JSON.stringify(rule.controllers), JSON.stringify(rule.outputs)]);
        return rows.insertId
    };

    /**
    * @method deleteruletemplatedetail
    * @description 룰 템플릿을 가져온다
    */
    var deleteruletemplatedetail = async (id) => {
        _query = "delete from core_rule_template where id = ?";
        await _pool.query(_query, [id]);
    };

    /**
     * @method getruletemplatedetail
     * @description 상세 템플릿을 가져온다
     */
    var getruletemplatedetail = async (id) => {
        _query = "select * from core_rule_template where id = ?"
        const [rows] = await _pool.query(_query, [id]);
        return rows[0]
    };

    /**
    * @method setruletemplatedetail
    * @description 룰 템플릿을 수정한다
    */
    var setruletemplatedetail = async (id, rule) => {
        _query = "update core_rule_template set name = ?,groupname = ?, autoapplying = ?, constraints = ?, configurations = ? , controllers = ?, outputs = ? where id = ? ";
        await _pool.query(_query, [rule.name, rule.groupname, rule.autoapplying, JSON.stringify(rule.constraints), JSON.stringify(rule.configurations), JSON.stringify(rule.controllers), JSON.stringify(rule.outputs), id]);
    };

    /**
     * @method getdataindexes
     * @description 전제 데이터인덱스를 얻어온다
     */
    var getdataindexes = async () => {
        _query = "select * from dataindexes where deleted = 0 ";
        const [rows] = await _pool.query(_query);
        return rows
    };

    /**
     * @method setdataindexes
     * @description 전제 데이터인덱스를 얻어온다
     */
    var setdataindexes = async (items) => {
        const connection = await _pool.getConnection(async conn => conn);
        try {
            await connection.beginTransaction();
            for (const item of items) {
                _query = "update dataindexes set name = ? where id = ? ";
                await connection.query(_query, [item.name, item.id]);
            }
            await connection.commit();
        }
        catch (error) {
            await connection.rollback();
            console.log(error)
            throw (error);
        } finally {
            connection.release();
        }
    };

    /**
     * @method deleteappliedRule
     * @description 룰을 삭제F한다
     */
    var deleteappliedRule = async (ruleId) => {
        const connection = await _pool.getConnection(async conn => conn);
        try {
            await connection.beginTransaction();
            _query = "update dataindexes set deleted = 1 where rule_id = ? ";
            await connection.query(_query, [ruleId]);

            _query = "update core_rule_applied set deleted = 1, updated = now() where id = ?";
            await connection.query(_query, [ruleId]);

            await connection.commit();
        }
        catch (error) {
            await connection.rollback();
            console.log(error)
            throw (error);
        } finally {
            connection.release();
        }
    };

    /**
     * @method setruleapplied
     * @description 룰을 수정한다
     */
    var setruleapplied = async (rule, ruleId) => {

        const connection = await _pool.getConnection(async conn => conn);
        try {
            await connection.beginTransaction();

            if (rule.hasOwnProperty('constraints')) {
                _query = "update core_rule_applied set constraints = ?, updated = now() where id = ?";
                await connection.query(_query, [JSON.stringify(rule.constraints), ruleId]);
            }
            if (rule.hasOwnProperty('inputs')) {
                _query = "update core_rule_applied set inputs = ?, updated = now() where id = ?";
                await connection.query(_query, [JSON.stringify(rule.inputs), ruleId]);
            }
            if (rule.hasOwnProperty('outputs')) {
                _query = "update core_rule_applied set outputs = ?, updated = now() where id = ?";
                await connection.query(_query, [JSON.stringify(rule.outputs), ruleId]);

                _query = "update dataindexes set name = ? where id = ?"

                if (rule.outputs.data) {
                    for (const [i, item] of rule.outputs.data.entries()) {
                        if (item.name && item.name.startsWith('#')) {
                            const splite = item.name.split(' ')
                            if (splite.length > 1) {
                                const name = splite[0]
                                const deviceIndex = name.replace('#', '')
                                const deviceName = rule.constraints.devices[deviceIndex - 1].name

                                const dataId = 30000000 + (ruleId * 10000) + item.outcode
                                await connection.query(_query, [deviceName + ' ' + splite[1], dataId]);
                            }
                        }
                    }
                }
            }
            if (rule.hasOwnProperty('controllers')) {
                _query = "update core_rule_applied set controllers = ?, updated = now() where id = ?";
                await connection.query(_query, [JSON.stringify(rule.controllers), ruleId]);
            }
            if (rule.hasOwnProperty('configurations')) {
                _query = "update core_rule_applied set configurations = ?, updated = now() where id = ?";
                await connection.query(_query, [JSON.stringify(rule.configurations), ruleId]);
            }
            if (rule.hasOwnProperty('used')) {
                _query = "update core_rule_applied set used = ?, updated = now() where id = ?";
                await connection.query(_query, [rule.used, ruleId]);
            }
            if (rule.timespan) {
                _query = "update core_timespan set timespan = ?, updated = now() where id = ? and field_id = ?";
                await connection.query(_query, [JSON.stringify(rule.timespan.timespan), rule.timespan.id, rule.timespan.field_id]);
            }
            await connection.commit();
        }
        catch (error) {
            await connection.rollback();
            console.log(error)
            throw (error);
        } finally {
            connection.release();
        }
    };


    /**
     * @method addruleapplied
     * @description 룰을 추가한다
     */
    var addruleapplied = async (rule, fieldId) => {

        const connection = await _pool.getConnection(async conn => conn);
        try {
            await connection.beginTransaction();
            _query = "insert into core_rule_applied " +
                "(name,updated,field_id,used,constraints,configurations,inputs,controllers,outputs,groupname,autoapplying,template_id) " +
                "values (?, now(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            const [appliedResult] = await connection.query(_query, [rule.name, fieldId, 0, JSON.stringify(rule.constraints), JSON.stringify(rule.configurations), JSON.stringify(rule.inputs), JSON.stringify(rule.controllers), JSON.stringify(rule.outputs), rule.groupname, rule.autoapplying, rule.id]);
            const appliedId = appliedResult.insertId

            let id = 30000000 + (appliedId * 10000)

            if (rule.controllers.trigger) {
                _query = "insert into dataindexes " +
                    "(id,rule_id,name) " +
                    "values (?, ?, ?)";
                await connection.query(_query, [id, appliedId, `${appliedId}번 룰 트리거 처리현황`]);

                _query = "INSERT INTO current_observations (data_id,obs_time,nvalue,modified_time) "
                    + "values (?, now(), ?, now()) ";
                await connection.query(_query, [id, 0]);
            }

            for (const [i, item] of rule.controllers.processors.entries()) {
                id = 30000000 + (appliedId * 10000) + (100 * (i + 1))
                _query = "insert into dataindexes " +
                    "(id,rule_id,name,field_id) " +
                    "values (?, ?, ?, ?)";
                await connection.query(_query, [id, appliedId, `${appliedId}번 룰 ${i + 1}번 컨트롤러처리현황`, fieldId]);

                _query = "INSERT INTO current_observations (data_id,obs_time,nvalue,modified_time) "
                    + "values (?, now(), ?, now()) ";
                await connection.query(_query, [id, 0]);
            }

            if (rule.outputs.data) {
                for (const [i, item] of rule.outputs.data.entries()) {
                    id = 30000000 + (appliedId * 10000) + item.outcode
                    _query = "insert into dataindexes " +
                        "(id,rule_id,name,field_id) " +
                        "values (?, ?, ?, ?)";

                    let name = item.outputs
                    if (item.name) {
                        name = item.name
                    }
                    await connection.query(_query, [id, appliedId, name, fieldId]);

                    _query = "INSERT INTO current_observations (data_id,obs_time,nvalue,modified_time) "
                        + "values (?, now(), ?, now()) ";
                    await connection.query(_query, [id, 0]);
                }
            }

            if (rule.autoapplying === 1 && rule.constraints.data) {
                let inputs = []
                for (const data of rule.constraints.data) {
                    const spliteData = data.idfmt.split(']')
                    const id = (fieldId * 100000) + Number(spliteData[spliteData.length - 1])
                    inputs.push({
                        key: data.key,
                        dataid: id
                    })
                }
                const updateQuery = "update core_rule_applied set inputs = ?, used = 1 where id = ? ";
                await connection.query(updateQuery, [JSON.stringify(inputs), appliedId]);
            }

            await connection.commit();
            return appliedId
        }
        catch (error) {
            await connection.rollback();
            console.log(error)
            throw (error);
        } finally {
            connection.release();
        }
    };

    /**
    * @method getruleapplied
    * @description 설정된 룰을 가져온다
    */
    var getruleapplied = async (type, id) => {
        if (type == 'rule') {
            _query = "select * from core_rule_applied where id = ?";
            const [rows] = await _pool.query(_query, [id]);
            return rows[0]
        } else if (type == 'field') {
            _query = "select * from core_rule_applied where field_id = ? and deleted = 0";
            const [rows] = await _pool.query(_query, [id]);
            return rows
        }
    };

    /**
    * @method gettimespan
    * @description 해당 구역의 timespan 데이터를 가져온다
    */
    var gettimespan = async (timespanId, fieldId) => {
        _query = "select * from core_timespan";
        const [rows] = await _pool.query(_query);
        return rows
    }

    /**
   * @method addtimespan
   * @description 타임스팬을 추가한다
   */
    var addtimespan = async (item) => {
        _query = "select max(id)+1 as id from core_timespan "
        let [rows] = await _pool.query(_query);

        _query = "INSERT INTO core_timespan (timespan,name,updated,id,field_id) "
            + "values (?,?,now(),?,?) ";
        let [rows2] = await _pool.query(_query, [JSON.stringify(item.timespan), item.name, rows[0].id, -1]);
        return rows[0].id
    };

    /**
    * @method deltimespan
    * @description 타임스팬을 삭제한다
    */
    var deltimespan = async (id) => {
        _query = "delete from core_timespan where id = ? and field_id = -1";
        await _pool.query(_query, [id]);
    };

    /**
    * @method settimespan
    * @description 타임스팬을 수정한다
    */
    var settimespan = async (id, item) => {
        _query = "update core_timespan set name = ?, timespan = ?  where id = ? and field_id = -1";
        await _pool.query(_query, [item.name, JSON.stringify(item.timespan), id]);
    };

    /**
    * @method gettimespanfielditem
    * @description 해당 구역의 timespan 데이터를 가져온다
    */
    var gettimespanfielditem = async (timespanId, fieldId) => {
        _query = "select * from core_timespan where id = ? and field_id = ?";
        const [rows] = await _pool.query(_query, [timespanId, fieldId]);
        return rows[0]
    }

    /**
    * @method getgateinfo
    * @description cvtgate의 id 정보를 가져온다
    */
    var getgateinfo = async () => {
        _query = "select * from gate_info";
        const [rows] = await _pool.query(_query);
        return rows[0]
    }

    /**
    * @method getdevicegatelist
    * @description 등록된 장비의 coupleid를 가져온다
    */
    var getdevicegatelist = async () => {
        _query = "select DISTINCT coupleid from devices where deleted = 0";
        const [rows] = await _pool.query(_query);
        return rows
    }

    /**
    * @method setgateinfodetect
    * @description cvtgate의 detect 정보를 저장한다
    */
    var setgateinfodetect = async (detect) => {
        _query = "update gate_info set detect = ? ";
        await _pool.query(_query, [JSON.stringify(detect)]);
    }

    /**
    * @method getdevicehistory
    * @description 구동기 상태이력을 가져온다
    */
    var getdevicehistory = async (deviceId, date) => {
        const stateId = deviceId * 100 + 10000000
        //_query = "SELECT data_id,obs_time,nvalue FROM (SELECT*,(SELECT a.nvalue !=nvalue FROM observations WHERE data_id= ? AND obs_time BETWEEN DATE(?) AND DATE(?)+1 AND obs_time< a.obs_time ORDER BY obs_time DESC LIMIT 1) chg FROM observations a WHERE data_id= ? AND obs_time BETWEEN DATE(?) AND DATE(?)+1 ORDER BY obs_time DESC) result WHERE chg=1 or chg is null ORDER BY obs_time asc ";
        let query = "SELECT aaa.data_id,aaa.obs_time,aaa.nvalue,aaa.check_value FROM ("
            + "SELECT aa.data_id,aa.obs_time,aa.ROW,aa.nvalue,bb.obs_time AS obs_time2,bb.nvalue AS nvalue2,bb.row2,CASE WHEN aa.nvalue=bb.nvalue THEN 'Y' ELSE 'N' END AS check_value FROM ("
            + "SELECT a.*,@rownum :=@rownum+1 AS ROW FROM observations a WHERE a.data_id=? AND (@rownum :=0)=0 AND a.obs_time BETWEEN DATE(?) AND DATE(?)+1 ORDER BY a.obs_time DESC) aa,("
            + "SELECT a.*,@RNUM :=@RNUM+1 AS row2 FROM observations a,("
            + "SELECT @RNUM :=0) a WHERE a.data_id=? AND a.obs_time BETWEEN DATE(?) AND DATE(?)+1 ORDER BY a.obs_time DESC) bb WHERE aa.ROW+1=bb.row2) aaa WHERE aaa.check_value='N' ORDER BY aaa.obs_time ASC "
        let [states] = await _pool.query(query, [stateId, date, date, stateId, date, date]);

        console.log(_pool.format(query, [stateId, date, date, stateId, date, date]))

        if (states.length === 0) {
            query = "SELECT data_id,DATE(?) obs_time,nvalue from observations where data_id = ? and obs_time >= DATE(?) order by obs_time asc LIMIT 1 ";
            const [statesNext] = await _pool.query(query, [date, stateId, date]);
            console.log(_pool.format(query, [date, stateId, date]))
            states = statesNext
        }

        query = "SELECT * FROM requests where device_id = ? and senttime BETWEEN DATE(?) AND DATE(?)+1 ORDER BY senttime asc "
        console.log(_pool.format(query, [deviceId, date, date]))
        let [requests] = await _pool.query(query, [deviceId, date, date]);

        for (const request of requests) {
            if (request.params) {
                request.params = JSON.parse(request.params)
            }
        }

        const obj = {
            states,
            requests
        }
        return obj
    };

    /**
     * @method getlastquery
     * @description farmos_api 모듈에서 마지막으로 사용한 쿼리를 보여준다. 이 함수는 테스트용으로 사용된다.
     */
    var getlastquery = function () {
        return _query;
    };

    function date_to_str(format) {

        var year = format.getFullYear();
        var month = format.getMonth() + 1;
        if (month < 10) month = '0' + month;
        var date = format.getDate();
        if (date < 10) date = '0' + date;
        return year + "-" + month + "-" + date;
    }



    return {
        getDeviceHistory: getdevicehistory,
        getGateInfo: getgateinfo,
        getDeviceGateList: getdevicegatelist,
        setGateInfoDetect: setgateinfodetect,
        getTimespan: gettimespan,
        addTimespan: addtimespan,
        delTimespan: deltimespan,
        setTimespan: settimespan,
        getTimespanFieldItem: gettimespanfielditem,
        addRuleApplied: addruleapplied,
        getRuleApplied: getruleapplied,
        setRuleApplied: setruleapplied,
        deleteAppliedRule: deleteappliedRule,
        getDataIndexes: getdataindexes,
        setDataIndexes: setdataindexes,
        getRuleTemplate: getruletemplate,
        addRuleTemplate: addruletemplate,
        getRuleTemplateDetail: getruletemplatedetail,
        setRuleTemplateDetail: setruletemplatedetail,
        deleteRuleTemplateDetail: deleteruletemplatedetail,
        addDevices: adddevices,
        setDevice: setdevice,
        setDeviceManual: setdevicemanual,
        getDevices: getdevices,
        deleteDevice: deletedevice,
        getNodeDevices: getnodedevices,
        getfields: getfields,
        setfield: setfield,
        addfield: addfield,
        deleteField: deletefield,
        setfieldUiDevice: setfieldUiDevice,
        getfielddevices: getfielddevices,
        getfieldactuators: getfieldactuators,
        getfieldmotors: getfieldmotors,
        getfieldswitches: getfieldswitches,
        getlastobservations: getlastobservations,
        getlastobservationsforfield: getlastobservationsforfield,
        //getobservationsforgraph : getobservationsforgraph,
        getdeviceproperties: getdeviceproperties,
        setdeviceproperties: setdeviceproperties,
        getsensor: getsensor,
        getvirtualsensor: getvirtualsensor,
        getgraph: getgraph,
        getgraphall: getgraphall,
        getdailygraph: getdailygraph,
        getcondensation: getcondensation,
        getlastquery: getlastquery,
        getevents: getevents,
        geteventcnt: geteventcnt,
        checkevent: checkevent,
        getfarm: getfarm,
        setfarm: setfarm,
        login: login,
        logout: logout,
        updateuser: updateuser
    };
};

module.exports = farmos_api();
