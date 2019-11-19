import Vue from 'vue'

const state = {
  deviceList: []
}

const getters = {
  getAllFieldDevices (state, getters, rootState) {
    let fieldDeviceList = {}
    for (const field of rootState.field.items) {
      fieldDeviceList[field.id] = []
      for (const device of state.deviceList) {
        if (device.place.indexOf(field.id) >= 0) {
          fieldDeviceList[field.id].push(device)
        }
      }
    }
    return fieldDeviceList
  },
  getDevices (state) {
    return state.deviceList
  }
}

const actions = {
  fetchDeviceFields ({ dispatch, rootState }) {
    rootState.field.items.forEach(element => {
      dispatch('fetchDataFieldDevice', element.id)
    })
  },
  fetchDataFieldDevice: async ({ commit }, payload) => {
    try {
      const { data } = await Vue.axios.get(`field/${payload}/devices`)
      commit('setFieldDevices', { payload, data })
    } catch (error) { }
  },
  fetchDataDevice: async ({ commit }) => {
    try {
      const { data } = await Vue.axios.get('device')
      commit('setDevices', { data })
    } catch (error) {
    }
  }
}

const mutations = {
  setFieldDevices: (state, { payload, data }) => {
    Vue.set(state.fieldDeviceList, payload, data)
  },
  setDevices: (state, { data }) => {
    Vue.set(state, 'deviceList', data)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
