import Vue from 'vue'
import Router from 'vue-router'
import store from '@/store'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      component: () => import(/* webpackChunkName: "open" */ './views/app'),
      redirect: '/index',
      meta: {
        auth: true
      },
      children: [
        {
          path: 'index',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/Start')
        },
        {
          path: 'dashboard',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/dashboard')
        },
        {
          path: 'monitor',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/monitor')
        },
        {
          path: 'control/manual/nutrient-supply',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/control/manual'),
          props: { type: 'nutrient-supply' }
        },
        {
          path: 'control/manual/:id',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/control/manual'),
          props: (route) => ({ type: 'base', id: route.params.id })
        },
        {
          path: 'control/auto/:id',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/control/auto/list'),
          props: true
        },
        {
          path: 'control/auto/:fieldId/detail/:ruleId',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/control/auto/detail'),
          props: true
        },
        {
          path: 'farm',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/farmInfo')
        },
        {
          path: 'place',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/place')
        },
        {
          path: 'device',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/device/modify.vue')
        },
        {
          path: 'device/search',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/device/searchDevice')
        },
        {
          path: 'rule',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/rule/list')
        },
        {
          path: 'rule/:id',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/rule/detail'),
          props: true
        },
        {
          path: 'timespan',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/timespan/list')
        },
        {
          path: 'timespan/:id',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/timespan/detail'),
          props: true
        },
        {
          path: 'opensource',
          component: () => import(/* webpackChunkName: "open" */ './views/app/page/opensource'),
          props: true
        }
      ]
    },
    {
      path: '/init',
      component: () => import(/* webpackChunkName: "open" */ './views/init'),
      meta: {
        auth: true
      }
    },
    {
      path: '/login',
      component: () => import(/* webpackChunkName: "open" */ './views/Login'),
      meta: {
        auth: false
      }
    }
  ]
})

router.beforeEach((to, from, next) => {
  let meta = {}

  for (const record of to.matched) {
    meta = record.meta
    break
  }
  if (meta.hasOwnProperty('auth')) {
    if (meta.auth) {
      if (store.getters['user/isAuthenticated']) {
        if (meta.privilege) {
          if (store.state.user.info.privilege === meta.privilege) {
            next()
          } else {
            next({
              path: '/403'
            })
          }
        } else {
          next()
        }
      } else {
        next({
          path: '/login'
        })
      }
    } else {
      if (store.getters['user/isAuthenticated']) {
        next({
          path: '/'
        })
      } else {
        next()
      }
    }
  } else {
    next()
  }
})

export default router
