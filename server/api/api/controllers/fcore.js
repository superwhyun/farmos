/**
 * @fileoverview fcore api for fcore
 * @author joonyong.jinong@gmail.com
 * @version 1.0.0
 * @since 2018.05.25
 */

/*jshint esversion: 6 */

var configdir = __dirname + '/../../../conf/'
var configfile = 'hasg-ui.json'

//var jsonfile = require('jsonfile');
//var conffile = '../../common_api/conf/config.json';
//var _config = jsonfile.readFileSync(conffile);

var fs = require('fs')
var fcore = require('fcore.js')

var farmosconfig = __dirname + '/farmos-server.ini'
var farmos = require('farmos.js')
//var _modulename = 'fcore api'

var fcore_api = function() {
  var _readconfig = function(fname) {
    return new Promise(function(resolve, reject) {
      fs.readFile(configdir + fname, 'utf8', function(err, data) {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          resolve(JSON.parse(data))
        }
      })
    })
  }

  var _readconfigsync = function(fname) {
    var data = fs.readFileSync(configdir + fname, 'utf8')
    return JSON.parse(data)
  }

  var _writeconfig = function(fname, config) {
    return new Promise(function(resolve, reject) {
      fname = configdir + fname
      if (fs.existsSync(fname)) {
        fs.writeFile(fname, JSON.stringify(config, null, 4), function(
          err,
          data
        ) {
          if (err) {
            console.log(err)
            reject(err)
          } else {
            resolve()
          }
        })
      } else {
        console.log('no config file')
        reject(new Error('no config file'))
      }
    })
  }

  var _writeconfigsync = function(fname, config) {
    fname = configdir + fname
    if (fs.existsSync(fname)) {
      fs.writeFileSync(fname, JSON.stringify(config, null, 4), 'utf8')
      return true
    } else {
      console.log('no config file')
      return false
    }
  }

  var getmode = function(req, res) {
    fcore
      .initialize(configdir)
      .then(function() {
        return fcore.getmode()
      })
      .then(function(data) {
        res.json({
          mode: data
        })
      })
      .catch(function(err) {
        res.status(405).send(err)
      })
  }

  var getconfig = function(req, res) {
    var params = req.swagger.params
    var fname = configfile

    if ('file' in params && params.file.value) {
      fname = params.file.value
    }

    _readconfig(fname)
      .then(function(data) {
        console.log(data)
        res.setHeader('Content-Type', 'application/json')
        res.json(data)
      })
      .catch(function(err) {
        res.status(405).send(err)
      })
  }

  var setconfig = function(req, res) {
    var params = req.swagger.params
    if (
      'file' in params &&
      params.file.value &&
      'body' in params &&
      params.body.value
    ) {
      var fname = params.file.value.replace(/^.*[\\\/]/, '')
      if (fname == 'hasg.json' || fname == configfile) {
        res.status(405).send('wrong parameter')
      } else {
        _writeconfig(params.file.value, params.body.value)
          .then(function() {
            return fcore.initialize(configdir)
          })
          .then(function() {
            return fcore.setmodeforUI('reload')
          })
          .then(function() {
            res.json()
          })
          .catch(function(err) {
            res.status(405).send('fail to write config.')
          })
      }
    } else {
      res.status(405).send('no parameter')
    }
  }

  var _rulefiles = {
    ventilationload: {
      index: 'rule/ventilation-load-',
      control: 'rule/ventilation-control-'
    },
    heatload: {
      index: 'rule/heat-load-',
      control: 'rule/heat-control-'
    },
    condensation: {
      control: 'rule/condensation-control-'
    },
    badweather: {
      control: 'rule/badweather-control-'
    },
    CAI: {
      control: 'rule/crop-activity-index-control-'
    }
  }

  var _getrule = function(fldid, name, item) {}

  var _getautocontrolitem = function(item, idxrule) {
    var config = _readconfigsync(idxrule)
    var eq = config.controllers[4].equation
    var num = Number(eq.charAt(0))
    var option = {
      prediction: false,
      compensation: false
    }
    if (num == 2) {
      option = {
        prediction: true,
        compensation: false
      }
    } else if (num == 3) {
      option = {
        prediction: false,
        compensation: true
      }
    } else if (num == 4) {
      option = {
        prediction: true,
        compensation: true
      }
    }
    return option
  }

  var _findautocontrol = function(fldid, item, configs, prefix) {
    var ctrlname = prefix.control + fldid + '.json'

    for (var i in configs) {
      if (ctrlname == configs[i]) {
        if ('index' in prefix)
          return {
            use: true,
            option: {}
          }
        else
          return {
            use: true,
            option: {}
          }
      }
    }
    // not use
    if ('index' in prefix)
      return {
        use: false,
        //option: _getautocontrolitem(item, prefix.index + fldid + '.json')
        option: {}
      }
    else
      return {
        use: false,
        option: {}
      }
  }

  var getautocontrol = function(req, res) {
    var autocontrol = {
      mode: 'manual',
      ventilationload: {
        use: false,
        option: {
          prediction: false,
          compensation: false
        }
      },
      heatload: {
        use: false,
        option: {
          prediction: false,
          compensation: false
        }
      },
      condensation: {
        use: false,
        option: {}
      },
      badweather: {
        use: false,
        option: {}
      },
      CAI: {
        use: false,
        option: {}
      }
    }

    var params = req.swagger.params
    if ('fieldId' in params && params.fieldId.value) {
      var fldid = params.fieldId.value
      _readconfig('hasg.json')
        .then(function(config) {
          for (var item in autocontrol) {
            if (item == 'mode') autocontrol.mode = config.fieldrule[fldid].mode
            else
              autocontrol[item] = _findautocontrol(
                fldid,
                item,
                config.fieldrule[fldid].rule,
                _rulefiles[item]
              )
          }
          console.log(autocontrol)
          res.json(autocontrol)
        })
        .catch(function(err) {
          res.status(500).send(err)
        })
    } else {
      res.status(405).send('no parameter')
    }
  }

  var _setruleoption = function(fldid, option, idxname) {
    var num = 1
    if (option.prediction && option.prediction === true) num = num + 1
    if (option.compensation && option.compensation === true) num = num + 2
    var config = _readconfigsync(idxname)
    config.controllers[4].equation = num + 'vl-' + fldid
    return _writeconfigsync(idxname, config)
  }

  var _setfieldrule = function(fldid, autocontrol) {
    var rules = []
    for (var name in autocontrol) {
      var item = autocontrol[name]
      if (item.use && item.use === true) {
        var rule = _rulefiles[name].control
        console.log(name, rule)
        rules.push(rule + fldid + '.json')
        if ('index' in _rulefiles[name] && item.option) {
          _setruleoption(
            fldid,
            item.option,
            _rulefiles[name].index + fldid + '.json'
          )
        }
      }
    }
    return rules
  }

  var setautocontrol = function(req, res) {
    var params = req.swagger.params
    if (
      'fieldId' in params &&
      params.fieldId.value &&
      'body' in params &&
      params.body.value
    ) {
      var fldid = params.fieldId.value
      var autocontrol = params.body.value

      farmos
        .initialize(farmosconfig)
        .then(function() {
          return farmos.setfieldmode(fldid, autocontrol.mode)
        })
        .then(function() {
          return _readconfig('hasg.json')
        })
        .then(function(config) {
          config.fieldrule[fldid].mode = autocontrol.mode
          config.fieldrule[fldid].rule = _setfieldrule(fldid, autocontrol)

          var rules = []
          if (autocontrol.mode == 'auto') {
            rules = config.fieldrule[fldid].rule.slice()
          }

          for (var i in config.rule) {
            if (config.rule[i].indexOf(fldid + '.json') < 0) {
              rules.push(config.rule[i])
            }
          }
          console.log(rules)
          config.rule = rules
          return _writeconfig('hasg.json', config)
        })
        .then(function() {
          return fcore.initialize(configdir)
        })
        .then(function() {
          return fcore.setmodeforUI('reload')
        })
        .then(function() {
          res.json(autocontrol)
        })
        .catch(function(err) {
          res.status(500).send(err)
        })
    } else {
      res.status(405).send('no parameter')
    }
  }

  var getCAIarea = function(cai) {
    return [
      {
        time: '43200',
        value: 30
      },
      {
        time: '54000',
        value: 75
      }
    ]
  }

  var _getdateparamforgraph = function(params) {
    var detail = false
    var today = new Date()
    var datestr = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10)
    var hourstr =
      ' ' +
      new Date(today.getTime() - (-31 + today.getTimezoneOffset()) * 60000)
        .toISOString()
        .slice(11, 19)
    var startdate = params.body.value.startdate
    if (startdate) {
      var start = new Date(startdate)
      if (startdate.substring(0, 10) == datestr)
        // startdate is today then detail
        detail = true
      startdate =
        new Date(start.getTime() - start.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 10) + ' 00:00:00'
    } else {
      startdate = datestr + ' 00:00:00'
      detail = true
    }
    var enddate = params.body.value.enddate

    if (enddate) {
      var edate = new Date(params.body.value.enddate)
      if (edate > today) {
        enddate = datestr + hourstr
      }
    } else {
      enddate = datestr + hourstr
    }

    return {
      startdate: startdate,
      enddate: enddate,
      detail: detail
    }
  }

  var getfarmgraph = async function (req, res) {
    var params = req.swagger.params
    if (
      'body' in params &&
      params.body.value &&
      'device_id' in params.body.value
    ) {
      var devids = params.body.value.device_id
      var extra = params.body.value.extra || {}

      var graphdata = {}
      var dateparam = _getdateparamforgraph(params)

      const result = await farmos.getgraph(
        devids,
        dateparam.startdate,
        dateparam.enddate,
        dateparam.detail
      )

      graphdata.data = result
      graphdata.extra = {}
      if ('CAI' in extra) {
        graphdata.extra.CAI = getCAIarea(extra.CAI)
        console.log(graphdata.extra)
      } else if ('condensation' in extra) {
        graphdata.extra.condensation = [
          {
            time: '14400',
            value: 0
          },
          {
            time: '15000',
            value: 0
          }
        ]
        //graphdata.extra.condensation =
        // farmos.getcondensation (extra.condensation, 0.3);
      }
      console.log(graphdata)
      res.json(graphdata)
    } else {
      res.status(405).send('no parameter')
    }
  }

  var getfarmgraphdownload = async function(req, res) {
    var params = req.swagger.params
    if (
      'body' in params &&
      params.body.value &&
      'device_id' in params.body.value
    ) {
      var devids = params.body.value.device_id
      //var extra = params.body.value.extra || {}
      var dateparam = _getdateparamforgraph(params)

      const result = await farmos.getgraph(
        devids,
        dateparam.startdate,
        dateparam.enddate
      )
      var data = ''
      let dateSet = new Set();
      let dataIndex = []

      var tmp = []
      var j

      for (j = 0; j < result.length; j++) {
        let name = result[j].dname ? result[j].dname : result[j].name
        //name += result[j].unit ? ' (' + result[j].unit + ')' : ''
        tmp.push(name)
      }
      data = '시간,' + tmp.join(',') + '\n'
      
      for (const sensor of result) {
        dataIndex.push(0)
        for (const data of sensor.data) {
          var date = new Date(dateparam.startdate)
          date.setSeconds(data.time)
          date.setSeconds(0)
          dateSet.add(date.getTime())
        }  
      }

      dateSet = Array.from(dateSet).sort();
      dateSet.forEach( function (value) {
        tmp = []
        tmp.push(getTimeStamp(new Date(value)))

        for (let index = 0; index < dataIndex.length; index++) {
          let condition = true
          const dataSize = result[index].data.length

          while (condition) {
            
            if(dataIndex[index] >= dataSize) {
              condition = false
              continue
            }
            var date = new Date(dateparam.startdate)
            date.setSeconds(result[index].data[dataIndex[index]].time)
            date.setSeconds(0)

            if(value === date.getTime()) {
              tmp.push(result[index].data[dataIndex[index]].value) 
              condition = false
              dataIndex[index] += 1
            } else if(value < date.getTime()) {
              condition = false
              tmp.push('') 
            } else {
              dataIndex[index] += 1
            }
          }
        }
        data = data + tmp.join(',') + '\n'
      })

      res.setHeader(
        'Content-disposition',
        'attachment;filename=graphdata.csv'
      )
      res.set('Content-Type', 'text/csv')
      res.send(data)

    } else {
      res.status(405).send('no parameter')
    }
  }

  var _gettc = function (fldid) {
    return new Promise(function (resolve, reject) {
      _readconfig('rule/temperature-compensation-' + fldid + '.json')
        .then(function (config) {
          var eq = config.controllers[3].equation
          resolve(Number(eq.charAt(0)))
        })
        .catch(function (err) {
          console.log(err)
          reject(err)
        })
    })
  }

  var getfieldtcgraph = function (req, res) {
    var params = req.swagger.params

    if (
      'fieldId' in params &&
      params.fieldId.value &&
      'body' in params &&
      params.body.value &&
      'device_id' in params.body.value
    ) {
      var fldid = params.fieldId.value
      var devids = params.body.value.device_id
      var extra = params.body.value.extra || {}
      var today = new Date()
      var daysago = new Date(
        today.getTime() -
        7 /* days */ * 24 * 60 * 60 * 1000 -
        today.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 10)
      today = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10)
      var startdate = params.body.value.startdate || daysago + ' 00:00:00'
      var enddate = params.body.value.enddate || today + ' 24:00:00'
      var graphdata = {}

      console.log('1')
      farmos
        .initialize(farmosconfig)
        .then(function () {
          console.log('1')
          return farmos.getdailygraph(devids, startdate, enddate, 'max')
        })
        .then(function (result) {
          console.log('1')
          graphdata.data = result
          return _gettc(fldid)
        })
        .then(function (selectc) {
          console.log('1')
          graphdata.selecttc = selectc
          console.log(graphdata)
          res.json(graphdata)
        })
        .catch(function (err) {
          res.status(500).send(err)
        })
    } else {
      res.status(405).send('no parameter')
    }
  }

  var setfieldtc = function (req, res) {
    var params = req.swagger.params

    if (
      'fieldId' in params &&
      params.fieldId.value &&
      'selecttc' in params &&
      params.selecttc.value
    ) {
      var fldid = params.fieldId.value
      var day = params.selecttc.value

      var fname = 'rule/temperature-compensation-' + fldid + '.json'
      _readconfig(fname)
        .then(function (config) {
          config.controllers[3].equation = day + 'tc-' + fldid
          return _writeconfig(fname, config)
        })
        .then(function () {
          return fcore.initialize(configdir)
        })
        .then(function () {
          return fcore.setmodeforUI('reload')
        })
        .then(function () {
          res.json()
        })
        .catch(function (err) {
          console.log(err)
          res.status(500).send(err)
        })
    } else {
      res.status(405).send('no parameter')
    }
  }

  var login = function (req, res) {
    var ip = (
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress
    ).split(',')[0]
    console.log('login ip : ' + ip)

    var params = req.swagger.params

    if ('body' in params && params.body.value) {
      fcore
        .initialize(configdir)
        .then(function () {
          return fcore.login(params.body.value)
        })
        .then(function (user) {
          console.log(user)
          res.json(user)
        })
        .catch(function (err) {
          res.status(405).send(err)
        })
    } else {
      res.status(405).send('no parameter')
    }
  }

  var logout = function (req, res) {
    var params = req.swagger.params

    if ('userid' in params && params.userid.value) {
      fcore
        .initialize(configdir)
        .then(function () {
          return fcore.logout(params.userid.value)
        })
        .then(function () {
          res.json()
        })
        .catch(function (err) {
          res.status(405).send(err)
        })
    } else {
      res.status(405).send('no parameter')
    }
  }

  var updateuser = function (req, res) {
    var params = req.swagger.params

    if ('body' in params && params.body.value) {
      fcore
        .initialize(configdir)
        .then(function () {
          return fcore.updateuser(params.body.value)
        })
        .then(function (user) {
          res.json(user)
        })
        .catch(function (err) {
          res.status(405).send(err)
        })
    } else {
      res.status(405).send('no parameter')
    }
  }

  var getimage = function (req, res) {
    fs.readdir(__dirname + '/../../public/images/', (err, files) => {
      files.forEach(file => {
        console.log(file)
      })
      res.json(files)
    })
  }

  function getTimeStamp(date) {
    var s =
      leadingZeros(date.getFullYear(), 4) + '-' +
      leadingZeros(date.getMonth() + 1, 2) + '-' +
      leadingZeros(date.getDate(), 2) + ' ' +
  
      leadingZeros(date.getHours(), 2) + ':' +
      leadingZeros(date.getMinutes(), 2);
  
    return s;
  }
  
  function leadingZeros(n, digits) {
    var zero = '';
    n = n.toString();
  
    if (n.length < digits) {
      for (i = 0; i < digits - n.length; i++)
        zero += '0';
    }
    return zero + n;
  }  

  return {
    getFarmosConfig: getconfig,
    setFarmosConfig: setconfig,
    getMode: getmode,
    getFieldAutoControl: getautocontrol,
    setFieldAutoControl: setautocontrol,
    getFarmGraph: getfarmgraph,
    getFarmGraphDownload: getfarmgraphdownload,
    getFieldTCGraph: getfieldtcgraph,
    setFieldTC: setfieldtc,
    loginUser: login,
    logoutUser: logout,
    updateUser: updateuser,
    getImage: getimage
  }
}

module.exports = fcore_api()
