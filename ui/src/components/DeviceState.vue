<template>
  <b-badge
    :class="{'w-100' : !wrap}"
    :variant="variant"
  >{{value}} {{currentTime > 0 ? ' ( '+currentTime + text + ' )' : ''}}</b-badge>
</template>

<script>
export default {
  props: ['value', 'sub', 'text', 'wrap'],
  data () {
    return {
      valueTimer: Function,
      currentTime: 0
    }
  },
  watch: {
    sub (newValue, oldValue) {
      this.currentTime = this._.cloneDeep(Math.floor(newValue))
      if (this.currentTime <= 0) {
        clearInterval(this.valueTimer)
      } else {
        this.countDown()
      }
    }
  },
  mounted () {
    this.currentTime = Math.floor(this.sub)
    this.countDown()
  },
  methods: {
    countDown () {
      clearInterval(this.valueTimer)
      if (this.currentTime && this.currentTime > 0) {
        this.valueTimer = setInterval(() => {
          this.currentTime -= 1
          if (this.currentTime <= 0) {
            clearInterval(this.valueTimer)
          }
        }, 1000)
      }
    }
  },
  computed: {
    variant () {
      switch (this.value) {
        case '대기':
          return 'light'
        case '에러':
          return 'danger'
        case '교체 필요':
          return 'warning'
        case '교정 필요':
          return 'warning'
        case '작동중':
          return 'primary'
        case '여는중':
          return 'success'
        case '닫는중':
          return 'info'
        case '준비중':
          return 'secondary'
        case '공급중':
          return 'success'
        case '정지중':
          return 'info'
        default:
          return 'light'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
