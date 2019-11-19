<template>
  <span v-if="color" :style="{color : color}">({{ showValue }})</span>
</template>

<script>
export default {
  props: ['value'],
  data () {
    return {
      showValue: '',
      color: ''
    }
  },
  watch: {
    'value.nvalue': function (newValue, oldValue) {
      this.showValue = this.sigdigt_value(newValue - oldValue)
      if (this.showValue === 0) {
        this.color = ''
      } else {
        this.color = this.showValue > 0 ? '#32d065' : '#fc3c63'
      }
    }
  },
  methods: {
    sigdigt (nvalue) {
      const value = Math.pow(10, this.value.sigdigit)
      return Math.floor(nvalue * value) / value
    },
    sigdigt_value (nvalue) {
      const value = Math.pow(10, this.value.sigdigit)
      return Math.floor(nvalue * value) / value
    }
  }
}
</script>
