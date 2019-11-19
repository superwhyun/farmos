<template>
  <text
    :x="x(parameters.data[0].x)"
    :y="posY"
    :key="index"
    class="textSection"
  >{{ parameters.name }}</text>
</template>
<script>
export default {
  props: {
    lineStyle: {
      required: false,
      type: String,
      default: String
    },
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
  computed: {},
  methods: {
    x (x) {
      return this.xScale(this.xScaleFunction(x))
    },
    y (y) {
      return this.yScale(y)
    }
  }
}
</script>

<style scoped>
.textSection {
  text-anchor: middle;
  fill: steelblue;
  transition: all 1s;
}
</style>
