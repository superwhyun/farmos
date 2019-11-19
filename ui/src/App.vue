<template>
  <div style="height:100%">
    <vue-snotify></vue-snotify>
    <router-view />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  data () {
    return {
      notiDeviceTry: null
    }
  },
  watch: {
    getNotiLast (noti) {
      if (noti.code === 102) {
        this.$snotify.success('새 장비가 검색 되었습니다.')
      } else if (noti.code === 108) {
        if (this.notiDeviceTry !== null) {
          this.$snotify.remove(this.notiDeviceTry.id)
          this.notiDeviceTry = null
        }
        this.deviceSearchNoti()
      }
    },
    'getTryReq.deviceSearch' (newValue, oldValue) {
      this.deviceSearchNoti()
    },
    getOpidResLast (opid) {
      let msg = ''
      switch (opid.res) {
        case 0:
          msg += '명령을 전송 완료 하였습니다.'
          this.$snotify.success(msg, opid.msg)
          break
        case 1:
          msg += '명령이 실패 하였습니다.'
          this.$snotify.error(msg)
          break
        case 101:
          msg += '장비가 없습니다.'
          this.$snotify.warning(msg)
          break
        case 102:
          msg += '명령이 올바르지 않습니다'
          this.$snotify.warning(msg)
          break
        case 103:
          msg += '키워드가 올바르지 않습니다.'
          this.$snotify.warning(msg)
          break
        case 104:
          msg += '명령 전송 실패 하였습니다.'
          this.$snotify.error(msg)
          break
      }
    },
    $route (to, from) {
      this.deviceSearchNoti()
    }
  },
  computed: {
    ...mapGetters({
      getNotiLast: 'mqtt/getNotiMsgLast',
      getTryReq: 'mqtt/getTryReq',
      getOpidResLast: 'mqtt/getOpidResLast'
    })
  },
  methods: {
    deviceSearchNoti () {
      if (this.getTryReq.deviceSearch) {
        if (this.getTryReq.progress === 1) {
          if (this.$route.path === '/device/search') {
            if (this.notiDeviceTry !== null) {
              this.$snotify.remove(this.notiDeviceTry.id)
            }
            this.notiDeviceTry = null
          } else if (this.$route.path !== '/device/search') {
            if (this.notiDeviceTry === null) {
              this.notiDeviceTry = this.$snotify.async(
                '장비 검색중 입니다',
                'Device',
                () => new Promise((resolve, reject) => {}),
                {
                  closeOnClick: true
                }
              )
              this.notiDeviceTry.on('click', toast => {
                this.notiDeviceTry = null
                this.$snotify.remove(toast.id)
                this.$router.push(`/device/search`)
              })
            }
          }
        } else if (this.getTryReq.progress === 2) {
          if (this.$route.path === '/device/search') {
            if (this.notiDeviceTry !== null) {
              this.$snotify.remove(this.notiDeviceTry.id)
            }
            this.notiDeviceTry = null
          } else if (this.$route.path !== '/device/search') {
            if (this.notiDeviceTry === null) {
              this.notiDeviceTry = this.$snotify.confirm(
                '장비 검색이 완료 되었습니다',
                'Device',
                {
                  closeOnClick: false,
                  buttons: [
                    {
                      text: '이동',
                      action: toast => {
                        this.$snotify.remove(toast.id)
                        this.$router.push(`/device/search`)
                      },
                      bold: true
                    }
                  ]
                }
              )
            }
          }
        }
      }
    }
  }
}
</script>
<style>
.row {
  margin-right: 0px !important;
  margin-left: 0px !important;
}
/* 애니메이션 진입 및 진출은 다른 지속 시간 및  */
/* 타이밍 기능을 사용할 수 있습니다. */
.slide-fade-enter-active {
  transition: all 0.5s ease;
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(100px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
