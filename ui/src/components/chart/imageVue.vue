<template>
  <image
    v-if="parameters.x"
    :xlink:href="image"
    :x="getX"
    :y="posY - 47"
    width="70"
    height="70"
    style="opacity:0.2"/>
</template>

<script>
import sunrise from '@/assets/img/sunrise.svg'
import sunset from '@/assets/img/sunset.svg'

export default {
  props: {
    parameters: {
      required: false,
      type: Object,
      default: Object
    },
    posY: {
      required: false,
      type: Number,
      default: Number
    },
    index: {
      required: false,
      type: Number,
      default: Number
    },
    xScale: {
      required: false,
      type: Function,
      default: Function
    },
    yScale: {
      required: false,
      type: Function,
      default: Function
    },
    xScaleFunction: {
      type: Function,
      default: function name (params) {
        return params
      }
    }
  },
  computed: {
    getX () {
      return this.x(this.parameters.x) - 35
    },
    image: function () {
      /* eslint-disable */
      if (this.parameters.type === 'rise') {
        return sunrise
      } else {
        return sunset
      }
    }
  },
  methods: {
    x(x) {
      return this.xScale(this.xScaleFunction(x))
    },
    y(y) {
      return this.yScale(y)
    }
  }
}
</script>

<style scoped>
</style>

