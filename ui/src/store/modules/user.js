import jwt from 'jsonwebtoken'

function jwtDecode (token) {
  return jwt.decode(token)
}

export default {
  namespaced: true,
  state: {
    info: null,
    token: null,
    refreshToken: null
  },

  getters: {
    isAuthenticated: state => !!state.info,
    getdUser: state => state.currentUser
  },

  actions: {},

  mutations: {
    setCurrentUser (state, { token, refreshToken }) {
      state.info = jwtDecode(token)
      state.token = token
      state.refreshToken = refreshToken
    },
    unsetCurrentUser (state) {
      state.info = null
      state.token = null
      state.refreshToken = null
    },
    refresh (state, { token, refreshToken }) {
      state.token = token
      state.refreshToken = refreshToken
    }
  }
}
