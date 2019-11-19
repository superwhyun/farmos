import Vue from 'vue'

const state = {
  dataindexList: []
}

const getters = {
  getDataIndexList (state) {
    return state.dataindexList
  }
}

const actions = {
  fetchDataIndex: async ({ commit }, payload) => {
    try {
      const { data } = await Vue.axios.get(`dataindex`)
      commit('setDataIndex', { payload, data })
    } catch (error) { }
  }
}

const mutations = {
  setDataIndex: (state, { data }) => {
    Vue.set(state, 'dataindexList', data)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
