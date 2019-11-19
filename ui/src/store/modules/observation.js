import Vue from 'vue'

let observationInterval = null

const state = {
  items: {}

}

const getters = {
  getObservations (state) {
    return state.items
  }

}

const actions = {
  fetchDataObservations: async ({ dispatch, commit }) => {
    clearInterval(observationInterval)
    observationInterval = setInterval(function () {
      dispatch('fetchDataObservations')
    }, 60000)
    try {
      const { data } = await Vue.axios.get('farm/observation')
      commit('setObservations', data)
    } catch (error) { }
  }
}

const mutations = {
  setObservationObs (state, items) {
    for (const id in items) {
      try {
        if (id !== 'time') {
          // 상태
          let dataId = (1 * 10000000) + (id * 100)
          console.log(dataId)
          state.items[dataId].nvalue = items[id][1]

          // 관측치
          dataId += 1
          console.log(dataId)
          state.items[dataId].nvalue = items[id][0]
        }
      } catch (error) {
        console.log('없는 데이터 아이디')
      }
    }
  },
  setObservationNoti (state, items) {
    for (let id in items) {
      try {
        if (id !== 'code' && id !== 'time') {
          let dataId = (1 * 10000000) + (id * 100)
          if (items[id].hasOwnProperty('status')) {
            state.items[dataId].nvalue = items[id]['status']
          }
          if (items[id].hasOwnProperty('value')) {
            state.items[dataId + 1].nvalue = items[id]['value']
          }
          if (items[id].hasOwnProperty('position')) {
            state.items[dataId + 2].nvalue = items[id]['position']
          }
          if (items[id].hasOwnProperty('state-hold-time')) {
            state.items[dataId + 3].nvalue = items[id]['state-hold-time']
          }
          if (items[id].hasOwnProperty('remain-time')) {
            state.items[dataId + 4].nvalue = items[id]['remain-time']
          }
          if (items[id].hasOwnProperty('ratio')) {
            state.items[dataId + 5].nvalue = items[id]['ratio']
          }
          if (items[id].hasOwnProperty('control')) {
            state.items[dataId + 6].nvalue = items[id]['control']
          }
          if (items[id].hasOwnProperty('area')) {
            state.items[dataId + 7].nvalue = items[id]['area']
          }
          if (items[id].hasOwnProperty('alert')) {
            state.items[dataId + 8].nvalue = items[id]['alert']
          }
        }
      } catch (error) {
        console.log('없는 데이터 아이디')
      }
    }
  },
  setObservations (state, items) {
    for (const key in items) {
      if (items.hasOwnProperty(key)) {
        const obs = items[key]
        if (!state.items.hasOwnProperty(key)) {
          Vue.set(state.items, key, {})
        }
        for (const key2 in obs) {
          if (obs.hasOwnProperty(key2)) {
            Vue.set(state.items[key], key2, obs[key2])
          }
        }
      }
    }

    // state.items = items
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
