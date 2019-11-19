/**
 * @fileoverview farmos api for farmos
 * @author joonyong.jinong@gmail.com
 * @version 1.0.0
 * @since 2017.07.25
 */

/*jshint esversion: 6 */

/**
 * notice
 * swagger-node 에서 controller 에 대한 initalize 와 finalize를
 * 별도로 지원하지 않는것으로 보인다.
 * farmos.js 의 경우 initialize 는 여러번 호출해도 상관없기 때문에
 * 모든 작업 시작전에 initialize 를 호출한다.
 * finalize 의 경우 디비와의 연결을 종료하는 것인데, 프로세스 종료시
 * 자동으로 될 것으로 간주한다.
 **/

var farmos = require('farmos.js');
var _modulename = 'farmos api for farmos';
var fs = require("fs");
var auth = require('../helpers/securityHandlers')

var farmos_api = function () {
  /**
   * @method getfields
   * @description 농장 구역정보를 가져온다.
   */
  var getfields = async (req, res) => {
    try {
      const result = await farmos.getfields();
      const obj = JSON.parse(JSON.stringify(result));
      obj.forEach(element => {
        if (element.uiinfo) {
          element.uiinfo = JSON.parse(element.uiinfo)
        }
        if (element.cropinfo) {
          element.cropinfo = JSON.parse(element.cropinfo)
        }
      });
      res.json(obj);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
   * @method deletefield
   * @description 농장내 구역정보를 삭제한다.
   */
  var deletefield = async (req, res) => {
    try {
      const fieldId = req.swagger.params.fieldId.value;
      const result = await farmos.deleteField(fieldId);
      res.json(result);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  /**
   * @method setfields
   * @description 농장 구역정보를 수정한다.
   */
  var setfield = async (req, res) => {
    var params = req.swagger.params;
    if (('fieldId' in params) &&
      ('body' in params) && (params.body.value)) {
      var fieldid = params.fieldId.value;
      var field = params.body.value;

      try {
        const result = await farmos.setfield(fieldid, field);
        res.json(result);
      } catch (error) {
        res.status(500).send(error);
      }
    } else {
      res.status(400).send("No field id");
    }
  };

  /**
   * @method addfield
   * @description 농장 구역을 추가한다.
   */
  var addfield = async (req, res) => {
    try {
      var item = req.swagger.params.body.value;

      if (!item.name) {
        res.status(400).send("No field name");
        return;
      }
      if (!item.fieldtype) {
        res.status(400).send("No field fieldtype");
        return;
      }
      if (!item.latitude || !item.longitude) {
        res.status(400).send("No field latlng");
        return;
      }

      if (!item.plantdate) {
        delete item.plantdate
      }
      await farmos.addfield(item);
      res.json();
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
   * @method setfielduidevice
   * @description 필드 ui 장비 수정한다.
   */
  var setfielduidevice = async (req, res) => {
    try {
      var params = req.swagger.params;
      var data = params.body.value;
      const result = await farmos.setfieldUiDevice(params.fieldId.value, data.path, data.devices, data.datas, data.typeSelect);
      res.json(result);
    } catch (error) {
      res.status(500).send(error);
    }
  };

  var makeobject = function (result) {
    let obj = {};
    result.map(element => {
      obj[element.data_id] = element;
      delete obj[element.data_id].data_id;
    });
    return obj;
  };

  /**
   * @method getfieldobservation
   * @description 특정 농장 구역에 속한 장비들의 최근 관측치를 확인한다.
   */
  var getfieldobservation = async (req, res) => {
    var params = req.swagger.params;
    if (('fieldId' in params) && (params.fieldId.value)) {
      var fieldid = params.fieldId.value;

      try {
        const result = await farmos.getlastobservationsforfield(fieldid);
        res.json(makeobject(result));
      } catch (error) {
        res.status(500).send(error);
      }
    } else {
      res.status(400).send("no fieldId");
    }
  };

  /**
   * @method getfielddownload
   * @description 특정 농장 구역에 속한 장비들의 관측치를 다운로드한다.
   */
  var getfielddownload = function (req, res) {
    var params = req.swagger.params;
    if (('fieldId' in params) && (params.fieldId.value) &&
      ('datestr' in params) && (params.datestr.value)) {
      var fieldid = params.fieldId.value;
      var datestr = params.datestr.value;
      var dirname = "/usr/local/farmos/backup/";
      //var dirname = __dirname + "/../../../scripts/"; // for test
      var filename = "env_" + fieldid + "_" + datestr + ".csv";
      try {
        var data = fs.readFileSync(dirname + filename, "utf8");
        res.setHeader('Content-disposition',
          'attachment;filename=' + filename);
        res.set('Content-Type', 'text/csv');
        res.send(data);
      } catch (err) {
        console.log(err);
        res.status(400).json("no csv file.");
        console.log("sent");
      }
    } else {
      res.status(400).send("no fieldId or datestr");
    }
  };

  /**
   * @method getfarm
   * @description 농장 정보를 가져온다
   */
  var getfarm = async (req, res) => {
    try {
      const result = await farmos.getfarm();
      if (result.length > 0) {
        result[0].info = JSON.parse(result[0].info)
        res.json(result[0])
      } else {
        res.json({
          name: '',
          info: {
            telephone: '',
            address: '',
            postcode: '',
            gps: ''
          }
        })
      }
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  };

  /**
   * @method setfarm
   * @description 농장 정보를 수정한다
   */
  var setfarm = async (req, res) => {
    try {
      await farmos.setfarm(req.swagger.params.body.value);
      res.json()
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  };

  /**
   * @method getfarmobservation
   * @description 전체 농장에 속한 장비들의 최근 관측치를 확인한다.
   */
  var getfarmobservation = async (req, res) => {
    try {
      const result = await farmos.getlastobservations();
      res.json(makeobject(result));
    } catch (error) {
      res.status(500).send(error);
    }
  };

  /**
   * @method getdevices
   * @description 특정구역에 설치된 장비들의 리스트를 확인한다.
   */
  /* var getdevices = async (req, res) => {
      console.log(_modulename, 'getdevices');
      var params = req.swagger.params;
      if (('fieldId' in params) && (params.fieldId.raw)) {
          var fieldid = params.fieldId.value;

          try {
              const result = await farmos.getfielddevices(fieldid);
              res.json(makeobject(result));
          } catch (error) {
              res.status(500).send(error);
          }
      } else {
          res.status(400).send("no fieldId");
      }
  }; */

  /**
   * @method getmotors
   * @description 특정구역에 설치된 개폐기들의 상태를 확인한다.
   */
  var getmotors = async (req, res) => {
    console.log(_modulename, 'getactuators');
    var params = req.swagger.params;
    if (('fieldId' in params) && (params.fieldId.value)) {
      var fieldid = params.fieldId.value;

      try {
        const result = await farmos.getfieldmotors(fieldid);
        console.log(result);
        res.json(result);
      } catch (error) {
        res.status(500).send(error);
      }
    } else {
      res.status(400).send("no fieldId");
    }
  };

  /**
   * @method getswitches
   * @description 특정구역에 설치된 스위치들의 상태를 확인한다.
   */
  var getswitches = async (req, res) => {
    console.log(_modulename, 'getswitches');
    var params = req.swagger.params;
    if (('fieldId' in params) && (params.fieldId.value)) {
      var fieldid = params.fieldId.value;
      try {
        const result = await farmos.getfieldswitches(fieldid);
        //console.log (result);
        res.json(result);
      } catch (error) {
        res.status(500).send(error);
      }
    } else {
      res.status(400).send("no fieldId");
    }
  };

  /**
   * @method getactuators
   * @description 특정구역에 설치된 구동기들의 상태를 확인한다.
   */
  var getactuators = async (req, res) => {
    console.log(_modulename, 'getactuators');
    var params = req.swagger.params;
    if (('fieldId' in params) && (params.fieldId.value)) {
      var fieldid = params.fieldId.value;

      try {
        const result = await farmos.getfieldactuators(fieldid);
        console.log(result);
        res.json(result);
      } catch (error) {
        res.status(500).send(error);
      }
    } else {
      res.status(400).send("no fieldId");
    }
  };

  /**
   * @method getactuatorstatus
   * @description 구동기의 상태를 확인한다.
   */
  var getactuatorstatus = async (req, res) => {
    console.log(_modulename, 'getactuatorstatus');
    var params = req.swagger.params;
    if (('actuatorId' in params) && (params.actuatorId.value)) {
      var actid = params.actuatorId.value;

      try {
        const result = await farmos.getcontrolstatus(actid);
        console.log(result);
        res.json(result);
      } catch (error) {
        res.status(500).send(error);
      }
    } else {
      res.status(400).send("no fieldId");
    }
  };

  /**
   * @method getevents
   * @description 확인되지 않은 농장 이벤트정보를 가져온다.
   */
  var getevents = async (req, res) => {
    console.log(_modulename, 'getevents');
    var option = { method: ["UI"], checked: false };
    var cnt = 0;

    try {
      const ret = await farmos.geteventcnt(option);
      cnt = ret[0].cnt;
      const result = await farmos.getevents(option);
      console.log(result);
      res.json({ cnt: cnt, events: result });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  };

  /**
   * @method getallevents
   * @description 농장 이벤트정보를 가져온다.
   */
  var getallevents = async (req, res) => {
    console.log(_modulename, 'getallevents');
    var cnt = 0;
    var params = req.swagger.params;
    var option = null;

    if (('body' in params) && (params.body.value)) {
      option = params.body.value;
    }

    try {
      const ret = await farmos.geteventcnt(option);
      cnt = ret[0].cnt;
      if (!(option.limit)) {
        option.limit = cnt;
      }
      const result = await farmos.getevents(option);
      console.log(result);
      res.json({ cnt: cnt, events: result });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  };

  /**
   * @method checkevent
   * @description 농장 이벤트정보를 확인했다고 표시한다.
   */
  var checkevent = async (req, res) => {
    console.log(_modulename, 'checkevent');

    var params = req.swagger.params;
    var eventid = null;
    if (('eventid' in params) && (params.eventid.value)) {
      eventid = params.eventid.value;

      try {
        const result = await farmos.checkevent(eventid);
        res.json(result);
      } catch (error) {
        res.status(500).send(error);
      }
    } else {
      res.status(404).send("Event not found.");
    }
  };

  var adddevices = async (req, res) => {
    var params = req.swagger.params;
    try {
      const result = await farmos.addDevices(params.body.value);
      res.json(result);
    } catch (error) {
      res.status(500).send(error);
    }
  };

  var setdevice = async (req, res) => {
    var params = req.swagger.params;
    try {
      await farmos.setDevice(params.body.value);
      res.json({});
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  var deletedevice = async (req, res) => {
    var params = req.swagger.params;
    try {
      const result = await farmos.deleteDevice(params.body.value);
      res.json(result);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  var getfielddevices = async (req, res) => {
    try {
      var params = req.swagger.params;
      var fieldid = params.fieldId.value;

      const result = await farmos.getfielddevices(fieldid);
      result.forEach(element => {
        element.spec = JSON.parse(element.spec)
      });
      res.json(result);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  var getdevices = async (req, res) => {
    try {
      const result = await farmos.getDevices();
      result.forEach(element => {
        element.spec = JSON.parse(element.spec)
      });
      res.json(result);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  var setdevicemanual = async (req, res) => {
    try {
      await farmos.setDeviceManual();
      res.json({});
    } catch (error) {
      res.status(500).send(error);
    }
  };

  var getnodedevices = async (req, res) => {
    var params = req.swagger.params;
    var couleId = params.couple.value
    var gateId = params.gate.value
    var nodeId = params.node.value
    try {
      const result = await farmos.getNodeDevices(couleId, gateId, nodeId);
      result.forEach(element => {
        element.spec = JSON.parse(element.spec)
      });
      res.json(result);
    } catch (error) {
      res.status(500).send(error);
    }
  };

  /**
   * @method getruletemplate
   * @description 룰 템플릿 리스트를 가져온다
   */
  var getruletemplate = async (req, res) => {
    try {
      const result = await farmos.getRuleTemplate();
      result.forEach(element => {
        element.constraints = JSON.parse(element.constraints)
        element.configurations = JSON.parse(element.configurations)
        element.controllers = JSON.parse(element.controllers)
        element.outputs = JSON.parse(element.outputs)
      });
      res.json(result);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
  * @method addruletemplate
  * @description 룰 템플릿 리스트를 가져온다
  */
  var addruletemplate = async (req, res) => {
    try {
      const rule = req.swagger.params.body.value;
      const id = await farmos.addRuleTemplate(rule);
      res.json({ id });
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
   * @method deleteruletemplatedetail
   * @description 룰 템플릿을 가져온다
   */
  var deleteruletemplatedetail = async (req, res) => {
    try {
      const ruleId = req.swagger.params.ruleId.value;
      await farmos.deleteRuleTemplateDetail(ruleId);
      res.json();
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
   * @method getruletemplatedetail
   * @description 룰 템플릿을 가져온다
   */
  var getruletemplatedetail = async (req, res) => {
    try {
      const ruleId = req.swagger.params.ruleId.value;
      let result = await farmos.getRuleTemplateDetail(ruleId);
      result.constraints = JSON.parse(result.constraints)
      result.configurations = JSON.parse(result.configurations)
      result.controllers = JSON.parse(result.controllers)
      result.outputs = JSON.parse(result.outputs)
      res.json(result);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
   * @method setruletemplatedetail
   * @description 룰 템플릿을 수정한다
   */
  var setruletemplatedetail = async (req, res) => {
    try {
      const ruleId = req.swagger.params.ruleId.value;
      const rule = req.swagger.params.body.value;
      let result = await farmos.setRuleTemplateDetail(ruleId, rule);
      res.json(result);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
   * @method getdataindexes
   * @description 전제 데이터인덱스를 얻어온다
   */
  var getdataindexes = async (req, res) => {
    try {
      const result = await farmos.getDataIndexes();
      res.json(result);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
   * @method setdataindexes
   * @description 데이터인덱스를 수정한다
   */
  var setdataindexes = async (req, res) => {
    try {
      await farmos.setDataIndexes(req.swagger.params.body.value);
      res.json();
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
   * @method setruleapplied
   * @description 룰을 수정한다
   */
  var setruleapplied = async (req, res) => {
    try {
      const rule = req.swagger.params.rule.value;
      const ruleId = req.swagger.params.ruleId.value;
      await farmos.setRuleApplied(rule, ruleId);
      res.json();
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
   * @method deleteappliedRule
   * @description 룰을 삭제F한다
   */
  var deleteappliedRule = async (req, res) => {
    try {
      const ruleId = req.swagger.params.ruleId.value;
      await farmos.deleteAppliedRule(ruleId);
      res.json();
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };


  /**
   * @method addruleapplied
   * @description 룰을 추가한다
   */
  var addruleapplied = async (req, res) => {
    try {
      let fieldId = req.swagger.params.body.value.fieldId;
      let rule = req.swagger.params.body.value.rule;
      const result = await farmos.addRuleApplied(rule, fieldId);
      res.json({ id: result });
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
  * @method ruleJsonTrans() 
  * @description 룰 아이템을 JSON으로 변환한다
  */
  var ruleJsonTrans = (jsonString) => {
    const obj = JSON.parse(JSON.stringify(jsonString));

    if (obj instanceof Array) {
      obj.forEach(element => {
        if (element.constraints) {
          element.constraints = JSON.parse(element.constraints)
        }
        if (element.configurations) {
          element.configurations = JSON.parse(element.configurations)
        }
        if (element.inputs) {
          element.inputs = JSON.parse(element.inputs)
        }
        if (element.outputs) {
          element.outputs = JSON.parse(element.outputs)
        }
        if (element.controllers) {
          element.controllers = JSON.parse(element.controllers)
        }
      });
    } else {
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
    }
    return obj;
  }

  /**
  * @method getruleapplied_field
  * @description 추가된 룰을 가져온다
  */
  var getruleapplied_field = async (req, res) => {
    try {
      let params = req.swagger.params;

      let fieldId = undefined
      if (('fieldId' in params)) {
        fieldId = params.fieldId.value
      }

      const result = await farmos.getRuleApplied('field', fieldId);
      const obj = ruleJsonTrans(result)
      res.json(obj);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
  * @method getruleapplied_id
  * @description 추가된 룰을 가져온다
  */
  var getruleapplied_id = async (req, res) => {
    try {
      let params = req.swagger.params;

      let ruleId = undefined
      if (('ruleId' in params)) {
        ruleId = params.ruleId.value
      }

      const result = await farmos.getRuleApplied('rule', ruleId);
      const obj = ruleJsonTrans(result)
      res.json(obj);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
  * @method gettimespan
  * @description 해당 구역의 timespan 데이터를 가져온다
  */
  var gettimespan = async (req, res) => {
    try {
      const result = await farmos.getTimespan();

      for (const item of result) {
        if (item.timespan) {
          item.timespan = JSON.parse(item.timespan)
        }
      }

      res.json(result);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  }

  /**
* @method addtimespan
* @description 타임스팬 추가
*/
  var addtimespan = async (req, res) => {
    try {
      const item = req.swagger.params.body.value;
      const id = await farmos.addTimespan(item);
      res.json({ id });
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
  * @method deltimespan
  * @description 타임스팬을 삭제한다
  */
  var deltimespan = async (req, res) => {
    try {
      const id = req.swagger.params.timespanId.value;
      await farmos.delTimespan(id);
      res.json();
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
  * @method settimespan
  * @description 타임스팬을 수정한다
  */
  var settimespan = async (req, res) => {
    try {
      const id = req.swagger.params.timespanId.value;
      const item = req.swagger.params.body.value;
      let result = await farmos.setTimespan(id, item);
      res.json(result);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
  * @method gettimespanfielditem
  * @description 해당 구역의 timespan 데이터를 가져온다
  */
  var gettimespanfielditem = async (req, res) => {
    try {
      let params = req.swagger.params;
      const result = await farmos.getTimespanFieldItem(params.timespanId.value, params.fieldId.value);
      const obj = JSON.parse(JSON.stringify(result));
      if (obj.timespan) {
        obj.timespan = JSON.parse(obj.timespan)
      }
      res.json(obj);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  }

  /**
  * @method getgateinfo
  * @description cvtgate의 id 정보를 가져온다
  */
  var getgateinfo = async (req, res) => {
    try {
      const result = await farmos.getGateInfo();
      res.json(result);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  }

  /**
  * @method getdevicegatelist
  * @description 등록된 장비의 coupleid를 가져온다
  */
  var getdevicegatelist = async (req, res) => {
    try {
      const result = await farmos.getDeviceGateList();
      res.json(result);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  }

  /**
  * @method setgateinfodetect
  * @description cvtgate의 detect 정보를 저장한다
  */
  var setgateinfodetect = async (req, res) => {
    try {
      await farmos.setGateInfoDetect(req.swagger.params.body.value);
      res.json();
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  }

  /**
  * @method getdevicehistory
  * @description 구동기 상태이력을 가져온다
  */
  var getdevicehistory = async (req, res) => {
    try {
      let params = req.swagger.params;
      const result = await farmos.getDeviceHistory(params.deviceId.value, params.date.value);
      res.json(result);
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  function makeToken(item) {
    const token = auth.createToken(item)
    const refreshToken = auth.refreshToken(item)
    return { token, refreshToken }
  }

  /**
  * @method loginUser
  * @description 로그인을 시도한다
  */
  var loginUser = async (req, res) => {
    try {
      const result = await farmos.login(req.body.userid, req.body.passwd);
      console.log(result)

      const item = {
        userid: result.userid,
        privilege: result.privilege,
        basicinfo: result.basicinfo ? JSON.parse(result.basicinfo) : '',
        name: result.name
      }
      const { token, refreshToken } = makeToken(item)

      return res.json({
        token: token,
        refreshToken: refreshToken
      }).end()
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };

  /**
  * @method loginRefresh
  * @description 로그인을 시도한다
  */
  var loginRefresh = async (req, res) => {
    try {
      if (req.auth) {
        const item = {
          userid: req.auth.userid,
          privilege: req.auth.privilege,
          basicinfo: req.auth.basicinfo ? JSON.parse(req.auth.basicinfo) : '',
          name: req.auth.name
        }
        const { token, refreshToken } = makeToken(item)
        return res.json({
          token: token,
          refreshToken: refreshToken
        }).end()
      } else {
        const response = { message: 'Error: Credentials incorrect' }
        return res.status(401).json(response)
      }
    } catch (error) {
      console.log(error)
      res.sendStatus(500)
    }
  };

  /**
  * @method logoutUser
  * @description 로그아웃을 시도한다
  */
  var logoutUser = async (req, res) => {
    try {
      res.json({});
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  };


  return {
    loginUser: loginUser,
    loginRefresh: loginRefresh,
    logoutUser: logoutUser,
    getDeviceHistory: getdevicehistory,
    getTimespan: gettimespan,
    addTimespan: addtimespan,
    delTimespan: deltimespan,
    setTimespan: settimespan,
    getTimespanFieldItem: gettimespanfielditem,
    addRuleApplied: addruleapplied,
    getRuleApplied_Field: getruleapplied_field,
    getRuleApplied_Id: getruleapplied_id,
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
    deleteDevice: deletedevice,
    getDevices: getdevices,
    getFieldDevices: getfielddevices,
    getNodeDevices: getnodedevices,
    getFarmObservation: getfarmobservation,
    getFields: getfields,
    setField: setfield,
    deleteField: deletefield,
    setFieldUiDevice: setfielduidevice,
    addField: addfield,
    getActuators: getactuators,
    getMotors: getmotors,
    getSwitches: getswitches,
    getActuatorStatus: getactuatorstatus,
    getFieldObservation: getfieldobservation,
    getFieldDownload: getfielddownload,
    getEvents: getevents,
    getAllEvents: getallevents,
    checkEvent: checkevent,
    getFarm: getfarm,
    setFarm: setfarm,
    getGateInfo: getgateinfo,
    getDeviceGateList:getdevicegatelist,
    setGateInfoDetect: setgateinfodetect,
  };
};

module.exports = farmos_api();
