import store from '@/store'
import mqtt from 'mqtt'

const options = {
  keepalive: 10,
  clientId: 'WebClient-' + parseInt(Math.random() * 10000),
  protocolId: 'MQTT',
  protocolVersion: 4,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000
}
let client = null

let controleTime = null

function setSubscribe () {
  client.unsubscribe('#')

  const coupleId = store.getters['cvtgate/getCvtgate'].couple
  // eslint-disable-next-line no-undef
  let coupleList = _.cloneDeep(store.getters['cvtgate/getDeviceCouple'])

  if (coupleList.indexOf(coupleId) <= 0) {
    coupleList.push({ coupleid: coupleId })
  }

  for (const couple of coupleList) {
    // cvgate
    client.subscribe(`cvtgate/${couple.coupleid}/self/stat`, { qos: 1 })
    client.subscribe(`cvtgate/${couple.coupleid}/self/res`, { qos: 2 })
    client.subscribe(`cvtgate/${couple.coupleid}/self/noti`, { qos: 1 })

    client.subscribe(`cvtgate/${couple.coupleid}/+/obs/#`, { qos: 0 })
    client.subscribe(`cvtgate/${couple.coupleid}/+/res/#`, { qos: 2 })
    client.subscribe(`cvtgate/${couple.coupleid}/+/noti/#`, { qos: 1 })
  }
  console.log('couple subscribe')
}

function workObs (data) {
  store.commit('observation/setObservationObs', data.content)
}

function workRes (data) {
  switch (data.content.code) {
    case 101: // 노드가 탐색을 시작함
      break
  }
  store.commit('mqtt/setOpidRes', [data.content.opid, data.content.res])
}

function workNoti (data) {
  switch (data.content.code) {
    case 101: // 노드가 탐색을 시작함
      if (!opidDeviceChk(data)) return
      store.commit('mqtt/addNotiMsg', data.content)
      break
    case 102: // 노드가 탐색 됨
      if (!opidDeviceChk(data)) return
      store.commit('mqtt/addNotiMsg', data.content)
      store.commit('mqtt/addDeviceItem', data.content)
      break
    case 103: // 노드의 프로토콜 버전이 맞지 않음
      if (!opidDeviceChk(data)) return
      store.commit('mqtt/addNotiMsg', data.content)
      break
    case 104: // 노드 타입이 맞지 않음
      if (!opidDeviceChk(data)) return
      store.commit('mqtt/addNotiMsg', data.content)
      break
    case 105: // 노드 정보가 잘못되어 있음
      if (!opidDeviceChk(data)) return
      store.commit('mqtt/addNotiMsg', data.content)
      break
    case 106: // 노드/장비 스펙이 없음
      if (!opidDeviceChk(data)) return
      store.commit('mqtt/addNotiMsg', data.content)
      break
    case 107: // 장비 탐색이 취소됨
      store.commit('mqtt/addNotiMsg', data.content)
      store.commit('mqtt/clearDeviceItem')
      store.commit('mqtt/setTryReq', [false, 0])
      break
    case 108: // 장비 탐색이 종료됨
      if (!opidDeviceChk(data)) return
      store.commit('mqtt/addDeviceItemComplate', data.content)
      store.commit('mqtt/setTryReq', [true, 2])
      store.commit('mqtt/addNotiMsg', data.content)
      break
    case 201: // 구동기 상태
      store.commit('observation/setObservationNoti', data.content)
      store.commit('mqtt/addNotiMsg', data.content)
      break

    default:
      break
  }
}

/* function opidChk (data) {
  console.log(store.getters['mqtt/getOpid'](data.content.opid))
  if (store.getters['mqtt/getOpid'](data.content.opid)) {
    return true
  }
  return false
} */

function opidDeviceChk (data) {
  const id = store.getters['mqtt/getDeviceOpid']
  if (id === data.content.opid) {
    return true
  }
  return false
}

function createOpid () {
  const opid = Math.floor(Math.random() * (64000 - 1 + 1)) + 1
  return opid
}

export default (() => {
  return {
    isConnected () {
      if (client) {
        return true
      } else {
        return false
      }
    },
    mqttSubscribe () {
      setSubscribe()
    },
    mqttClose () {
      if (this.isConnected()) {
        client.end()
      }
    },
    mqttRefresh (host) {
      if (this.isConnected()) {
        return
      }

      client = mqtt.connect(`ws://${host}:9001`, options)

      client.on('connect', function () {
        console.log('client connected:' + options.clientId)
        setSubscribe()
      })

      client.on('error', function (err) {
        console.log(err)
        client.end()
      })

      client.on('message', function (topic, message, packet) {
        try {
          console.log('Received Message:= ' + message.toString() + '\nOn topic:= ' + topic)
          if (topic.lastIndexOf('self/stat') > 0) {
            console.log('stat :' + message)
          } else {
            const data = JSON.parse(message.toString())

            switch (data.type) {
              case 100: // OBSERVATION
                workObs(data)
                break
              case 300: // RESPONSE
                // if (!opidChk(data)) return
                workRes(data)
                break
              case 500: // NOTICE
                workNoti(data)
                break

              default:
                break
            }
          }
        } catch (error) {
          console.log(error)
        }
      })
    },
    removeSubscribe () {

    },

    deivceControl (device, control, param) {
      if (controleTime === null) {
        controleTime = new Date().getTime()
      } else {
        if ((new Date().getTime() - controleTime) / 1000 < 5) {
          return false
        }
      }
      controleTime = new Date().getTime()

      let msg = ''
      if (device.name && device.name.length > 0) {
        msg = device.name
      } else {
        msg = device.spec.Name
      }

      console.log(device)
      let params = {}
      switch (control) {
        case 0:
          msg += ' 정지'
          break
        case 1:
          msg += ' 리셋'
          break
        case 301:
          msg += ' 열기'
          break
        case 302:
          msg += ' 닫기'
          break
        case 303:
          msg += ' 시간 열기'
          params = {
            time: param.opentime
          }
          break
        case 304:
          msg += ' 시간 닫기'
          params = {
            time: param.closetime
          }
          break
        case 305:
          msg += ' 위치 이동'
          params = {
            position: param.position
          }
          break
        case 306:
          msg += ' 설정 저장'
          params = {
            opentime: param.opentime,
            closetime: param.closetime
          }
          break
        case 201:
          msg += ' 작동'
          break
        case 202:
          msg += ' 시간 작동'
          params = {
            'hold-time': param.holdtime
          }
          break
        case 203:
          msg += ' 시간및 방향'
          params = {
            'hold-time': param.holdtime,
            'ratio': param.ratio
          }
          break
        case 401:
          msg += ' 1회 관수'
          break
        case 402:
          msg += ' 제어 관수'
          params = {
            'EC': Number(param.ec),
            'pH': Number(param.ph),
            'on-sec': Number(param.sec),
            'start-area': Number(device.place.indexOf(param.startarea) + 1),
            'stop-area': Number(device.place.indexOf(param.stoparea) + 1)
          }
          break
        case 403:
          msg += ' 제어 변경'
          params = {
            'control': param.control
          }
          break

        default:
          break
      }

      const opid = createOpid()
      const item = {
        topic: `cvtgate/${device.coupleid}/${device.gateid}/req/${device.nid}`,
        body: { 'content': { 'id': device.id, 'cmd': control, 'param': params, 'opid': opid }, 'exkey': null, 'type': 200, 'nid': device.nid, 'extra': null },
        res: null,
        msg: msg
      }

      console.log(item)
      store.commit('mqtt/setOpid', [opid, item])
      client.publish(item.topic, JSON.stringify(item.body), { qos: 2 })

      return true
    },
    deivceSearch () {
      const coupleId = store.getters['cvtgate/getCvtgate'].couple
      const opid = createOpid()
      const item = {
        topic: `cvtgate/${coupleId}/self/req`,
        body: { 'content': { 'id': coupleId, 'cmd': 1001, 'param': {}, 'opid': opid }, 'exkey': null, 'type': 200, 'nid': null, 'extra': null },
        res: null
      }

      console.log(item)
      // body: { 'content': { 'id': coupleId, 'cmd': 1001, 'param': {}, 'opid': opid }, 'exkey': null, 'type': 200, 'nid': null, 'extra': null },
      // body: { 'content': { 'id': coupleId, 'cmd': 1001, 'param': { 'saddr': 1, 'eaddr': 3, 'port': 'USB0' }, 'opid': opid }, 'exkey': null, 'type': 200, 'nid': null, 'extra': null },
      store.commit('mqtt/setOpid', [opid, item])
      store.commit('mqtt/setDeviceOpid', opid)
      store.commit('mqtt/setTryReq', [true, 1])
      client.publish(`cvtgate/${coupleId}/self/req`, JSON.stringify(item.body), { qos: 2 })
    },
    deivceSearchCancel () {
      const coupleId = store.getters['cvtgate/getCvtgate'].couple
      const opid = createOpid()
      const item = {
        topic: `cvtgate/${coupleId}/self/req`,
        body: { 'content': { 'id': coupleId, 'cmd': 1002, 'param': {}, 'opid': opid }, 'exkey': null, 'type': 200, 'nid': null, 'extra': null },
        res: null
      }
      store.commit('mqtt/setOpid', [opid, item])
      client.publish(`cvtgate/${coupleId}/self/req`, JSON.stringify(item.body), { qos: 2 }, (error) => {
        if (!error) {
          store.commit('mqtt/clearDeviceItem')
          store.commit('mqtt/setTryReq', [false, 0])
        }
      })
    }
  }
})()
