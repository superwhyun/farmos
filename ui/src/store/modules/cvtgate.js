import Vue from 'vue'

const state = {
  items: {},
  deviceCouple: []
}

const getters = {
  getCvtgate (state) {
    return state.items
  },
  getDeviceCouple (state) {
    return state.deviceCouple
  }
}

const actions = {
  fetchDataCvtgate: async ({ commit }) => {
    try {
      const { data } = await Vue.axios.get('gateinfo')
      commit('setCvtgate', data)
    } catch (error) { }
  },
  fetchDataCoupleList: async ({ commit }) => {
    try {
      const { data } = await Vue.axios.get('devicegate')
      commit('setDevicegate', data)
    } catch (error) { }
  }
}

const mutations = {
  setCvtgate (state, items) {
    state.items = items
  },
  setDevicegate (state, items) {
    state.deviceCouple = items
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
