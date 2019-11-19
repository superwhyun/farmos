import Vue from 'vue'

const state = {
  items: {}

}

const getters = {
  getWeather (state) {
    return state.items
  }

}

const actions = {
  fetchDataWeather: async ({ dispatch, commit }) => {
    /*  try {
      const { data } = await Vue.axios.get(
        `https://api.apixu.com/v1/forecast.json?key=b26ac48768b64da2aae125932190705&lang=ko&days=7&q=` +
          payload
      )
      commit('setWeather', data)
    } catch (error) {
      console.log(error)
    } */
  }
}

const mutations = {
  setWeather (state, items) {
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
