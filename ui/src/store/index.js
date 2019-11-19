import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

import cvtgate from './modules/cvtgate'
import farm from './modules/farm'
import field from './modules/field'
import observation from './modules/observation'
import device from './modules/device'
import mqtt from './modules/mqtt'
import user from './modules/user'
import dataIndex from './modules/dataIndex'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    cvtgate,
    farm,
    field,
    observation,
    device,
    mqtt,
    user,
    dataIndex
  },
  plugins: [createPersistedState({
    paths: ['user']
  })]

})

store.watch((state, getters) =>
  getters['field/getFields'], (val) => {
  store.dispatch('device/fetchDataDevice')
})

export default store
