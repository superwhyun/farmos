<template>
  <g>
    <circle
      :style="{opacity:opacity ,stroke:color()}"
      :cx="xValue"
      :cy="yValue"
      r="8"
      class="circle"
    />
    <text
      :style="{opacity:opacity, fill:color()}"
      :x="xValue+10"
      :y="yValue+4"
    >{{ deviceId ? deviceId.toString().endsWith('00') ? statusCode[yScale.invert(yValue).toFixed(0)]  : yScale.invert(yValue).toFixed(1) + unit : ''}}</text>

    <!-- element.id.toString().endsWith('00') -->
  </g>
</template>
<script>
import * as d3 from 'd3'
import { statusCode } from '@/constants/config'
export default {
  props: {
    deviceId: Number,
    index: {
      required: false,
      type: Number,
      default: 0
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
    xValue: {
      required: false,
      type: Number,
      default: 0
    },
    yValue: {
      required: false,
      type: Number,
      default: 0
    },
    opacity: {
      required: false,
      type: Number,
      default: 0
    },
    unit: {
      required: false,
      type: String,
      default: String
    }
  },
  data () {
    return {
      statusCode: statusCode
    }
  },
  methods: {
    color () {
      return d3.schemeCategory10[this.index % 10]
    },
    x (x) {
      return x
      /* return this.xScale(this.xScaleFunction(x)) */
    },
    y (y) {
      return y
      /* return this.yScale(y) */
    }
  }
}
</script>

<style scoped>
.circle {
  fill: none;
  stroke-width: 1px;
  stroke: rgb(0, 0, 0);
}
</style>
