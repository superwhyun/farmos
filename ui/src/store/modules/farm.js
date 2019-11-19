import Vue from 'vue'

const state = {
  items: {}

}

const getters = {
  getFarm (state) {
    return state.items
  }
}

const actions = {
  fetchDataFarm: async ({ commit }) => {
    try {
      const { data } = await Vue.axios.get('farm')
      commit('setFarm', data)
    } catch (error) { }
  }
}

const mutations = {
  setFarm (state, items) {
    state.items = items
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
