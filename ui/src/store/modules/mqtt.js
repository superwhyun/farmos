import Vue from 'vue'

const state = {
  opidRes: {},
  opids: {},
  deivce: {
    opid: '',
    item: [],
    itemComplate: {}
  },
  tryReq: {
    deviceSearch: false,
    progress: 0
  },
  notiMsgs: []
}

const getters = {
  getOpid: (state) => (opid) => {
    return state.opids[opid]
  },
  getNotiMsgLast: (state) => {
    return state.notiMsgs[0]
  },
  getOpidResLast: (state) => {
    return state.opidRes
  },
  getTryReq: (state) => {
    return state.tryReq
  },
  getDeviceItems: (state) => {
    return state.deivce.item
  },
  getDeviceItemComplate: (state) => {
    return state.deivce.itemComplate
  },
  getDeviceOpid: (state) => {
    return state.deivce.opid
  }
}

const actions = {

}

const mutations = {
  setTryReq: (state, [use, progress]) => {
    console.log('setTryReq')
    state.tryReq.deviceSearch = use
    state.tryReq.progress = progress
  },
  setOpid: (state, [opid, item]) => {
    console.log('setOpid')
    state.opids[opid] = item
  },
  setOpidRes: (state, [opid, res]) => {
    console.log('setOpidRes')
    state.opids[opid].res = res
    Vue.set(state, 'opidRes', state.opids[opid])
  },
  setDeviceOpid: (state, payload) => {
    console.log('setDeviceOpid')
    state.deivce.opid = payload
  },
  addDeviceItem: (state, item) => {
    console.log('addDeviceItem')
    state.deivce.item.push(item)
  },
  clearDeviceItem: (state) => {
    console.log('clearDeviceItem')
    state.deivce.item.splice(0, state.deivce.item.length)
    Vue.set(state.deivce, 'itemComplate', {})
    Vue.set(state.deivce, 'item', [])
    Vue.set(state.deivce, 'opid', '')
  },
  addNotiMsg: (state, item) => {
    console.log('addNotiMsg')
    state.notiMsgs.unshift(item)
  },
  addDeviceItemComplate: (state, item) => {
    console.log('addDeviceItemComplate')
    Vue.set(state.deivce, 'itemComplate', item)
    Vue.set(state.deivce, 'item', [])
    Vue.set(state.deivce, 'opid', '')
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
