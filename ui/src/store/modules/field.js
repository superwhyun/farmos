import Vue from 'vue'

/* let uiData = {
      'index': {
          'local': {
            'userSet': false,
            'device': []
          },
          'greenhouse': {
            'userSet': false,
            'device': []
          },
          'actuator': {
            'userSet': false,
            'device': []
          }
        }
    } */

const state = {
  items: []

}

const getters = {
  getFields (state) {
    return state.items
  },
  getField: (state) => (id) => {
    // eslint-disable-next-line eqeqeq
    return state.items.filter(item => item.id == id)[0]
  }
}

const actions = {
  fetchDataField: async ({ commit }) => {
    try {
      const { data } = await Vue.axios.get('field')
      commit('setFields', data)
    } catch (error) { }
  },
  fetchSetUiDevice: async ({ commit }, [fieldId, path, devices, datas, typeSelect]) => {
    try {
      let setData = {
        path
      }
      if (devices !== null) {
        setData.devices = devices
      }
      if (datas !== null) {
        setData.datas = datas
      }
      if (typeSelect !== null) {
        setData.typeSelect = typeSelect
      }

      const { data } = await Vue.axios.put(`field/${fieldId}/uiDevice`, setData)
      commit('setUiDevice', [fieldId, data])
    } catch (error) {
    }
  }
}

const mutations = {
  setFields (state, items) {
    state.items = items
  },
  setUiDevice (state, [fieldId, data]) {
    state.items.forEach(element => {
      if (element.id === fieldId) {
        Vue.set(element, 'uiinfo', data)
        // element.ui_device = data
      }
    })
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
