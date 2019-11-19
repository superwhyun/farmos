import Vue from 'vue'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'

import { format, isDate, isValid, parse } from 'date-fns'
import ko from 'date-fns/locale/ko'
import VueLodash from 'vue-lodash'
import axios from 'axios'
import VueAxios from 'vue-axios'

import VueDaumPostcode from '@/components/DaumPost'

import BootstrapVue from 'bootstrap-vue'
import ElementUI from 'element-ui'
import Snotify from 'vue-snotify'

import Scrollspy from 'vue2-scrollspy'

import VueAwesomeSwiper from 'vue-awesome-swiper'

import locale from 'element-ui/lib/locale/lang/ko'
import { api } from '@/constants/config'
import mqtt from './mqttUi'

import InfiniteSlideBar from 'vue-infinite-slide-bar'

import '@/assets/scripts'
import 'swiper/dist/css/swiper.css'

Vue.config.productionTip = false

axios.defaults.baseURL = api
const axiosRefreshInstance = axios.create({
  baseURL: api
})

axiosRefreshInstance.interceptors.request.use(config => {
  const method = config.method.toUpperCase()
  if (method !== 'OPTIONS' && method === 'POST') {
    if (store.state.user.token) {
      config.headers = {
        ...config.headers,
        'Authorization': 'Bearer ' + store.state.user.refreshToken
      }
    }
  }
  return config
})

axios.interceptors.request.use(config => {
  const method = config.method.toUpperCase()
  if (method !== 'OPTIONS' && !config.url.startsWith('https://api.openweathermap.org')) {
    if (store.state.user.token) {
      config.headers = {
        ...config.headers,
        'Authorization': 'Bearer ' + store.state.user.token
      }
    }
  }
  return config
})

axios.interceptors.response.use(null, error => {
  if (error.response && error.response.config) {
    if (error.response.status === 401) {
      const retryConfig = error.response.config
      if (store.state.user.token && store.state.user.refreshToken) {
        axiosRefreshInstance.post('user/login/refresh', {})
          .then(response => {
            store.commit('user/refresh', { token: response.data.token, refreshToken: response.data.refreshToken })
            return axios.request(retryConfig)
          }).catch(error => {
            store.commit('user/unsetCurrentUser')
            console.log(error)
            return Promise.reject(error)
          })
      } else {
        store.commit('user/unsetCurrentUser')
        location.replace('/')
        return Promise.reject(error)
      }
    } else if (error.response.status === 403) {
      store.commit('user/unsetCurrentUser')
      location.replace('/')
      return Promise.reject(error)
    } else {
      return Promise.reject(error)
    }
  } else {
    return Promise.reject(error)
  }
})

Vue.use(BootstrapVue)
Vue.use(VueAxios, axios)
Vue.use(VueLodash, { name: 'lodash' })
Vue.use(Snotify)
Vue.use(Scrollspy)

Vue.use(ElementUI, { locale })
Vue.use(VueAwesomeSwiper /* { default global options } */)

Vue.component('VueDaumPostcode', VueDaumPostcode)
Vue.component('InfiniteSlideBar', InfiniteSlideBar)

Vue.mixin({
  data: function () {
    return {
      mqtt
    }
  },
  methods: {
    $date: () => {
      return {
        format,
        isDate,
        isValid,
        parse,
        ko
      }
    }
  }
})

Vue.filter('digit', function (data) {
  if (data) {
    if (data.unit === '상태') {
      return this.statusCode[data.nvalue]
    } else {
      const value = Math.pow(10, data.sigdigit)
      return `${Math.floor(data.nvalue * value) / value} ${data.unit}`
    }
  } else {
    return '---'
  }
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
