<template>
  <path
    :d="d"
    :class="lineStyle"
    :style="{stroke: color,filter:filter}"
    :key="index"/>
</template>
<script>
import * as d3 from 'd3'
export default {
  props: {
    filter: {
      required: false,
      type: String,
      default: String
    },
    lineType: {
      required: false,
      type: String,
      default: String
    },
    lineStyle: {
      required: false,
      type: String,
      default: String
    },
    parameters: {
      required: false,
      type: Array,
      default: Array
    },
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
    xScaleFunction: {
      type: Function,
      default: function name (params) {
        return params
      }
    }
  },
  watch: {

  },
  data () {
    return {
      curveArray: {
        monotone: d3.curveMonotoneX,
        straight: d3.curveLinear,
        step: d3.curveStepBefore
      }
    }
  },
  computed: {
    color () {
      return d3.schemeCategory10[this.index % 10]
    },
    d () {
      var xScale = this.xScale
      var yScale = this.yScale
      var xScaleFunction = this.xScaleFunction

      var line = d3
        .line()
        .defined((d, i, item) => {
          if (item[i - 1]) {
            if (d.time - item[i - 1].time > 300) {
              return false
            }
          } else {
            return true
          }
          return true
        })
        .curve(this.curveArray[this.lineType])
        .x(function (d, i) {
          if (d['x'] === undefined) {
            return xScale(i)
          } else {
            return xScale(xScaleFunction(d.x))
          }
        })
        .y(function (d) {
          if (d['y'] === undefined) {
            return yScale(d.value)
          } else {
            return yScale(d.y)
          }
        })
      return line(this.parameters)
    }
  }
}
</script>

<style scoped>
.suntime {
  fill: none;
  stroke-width: 10px;
  stroke-opacity: 0.7;
  stroke-dasharray: 2, 50;
  transition: all 1s;
}

.line {
  fill: none;
  stroke-width: 2px;
  stroke-opacity: 0.4;
  transition: all 1s;
  shape-rendering: optimizeQuality;
}

.section {
  fill: none;
  stroke-width: 1.5px;
  stroke-opacity: 0.5;
  stroke-dasharray: 2.5, 2.5;
  transition: all 1s;
}

.dash {
  fill: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* stroke-dasharray: 3px 3px; */
  stroke-width: 4px;
  stroke-opacity: 0.6;
  transition: all 1s;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.dash-ani {
  fill: none;
  stroke-dasharray: 3px 3px;
  stroke-linejoin: round;
  stroke-linecap: round;
  -webkit-animation: moving-dashes 1s linear infinite;
}
</style>
