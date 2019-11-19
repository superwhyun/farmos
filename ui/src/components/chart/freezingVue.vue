<template>
  <rect
    :fill="'url(#diagonalHatch' +id+ ')'"
    :x="x(parameters.x)"
    :y="y(parameters.y)"
    :width="x2(parameters.x,parameters.x2)"
    :height="y(parameters.y2)"/>
</template>

<script>
export default {
  props: {
    id: {
      required: false,
      type: String,
      default: String
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
    parameters: {
      required: false,
      type: Object,
      default: Object
    },
    xScaleFunction: {
      type: Function,
      default: function name (params) {
        return params
      }
    }
  },
  mounted () {},
  methods: {
    x (x) {
      return this.xScale(this.xScaleFunction(x))
    },
    x2 (x, x2) {
      let a = this.xScale(this.xScaleFunction(x))
      let b = this.xScale(this.xScaleFunction(x2))
      return b - a
    },
    y (y) {
      return this.yScale(y)
    }
  }
}
</script>

<style scoped>
</style>
