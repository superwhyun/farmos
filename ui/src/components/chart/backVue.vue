<template>
  <g v-if="yScale !== undefined">
    <rect
      v-for="(data,i) in parameters"
      :key="i"
      :x="0"
      :y="y(max * data.y2/ 100)"
      :width="width"
      :height="y(max * (100-(data.y2-data.y1))/ 100)"
      :style="'opacity:0.2;fill:'+data.color"/>
  </g>
</template>

<script>
import * as d3 from 'd3'
export default {
  props: {
    max: {
      required: false,
      type: Number,
      default: Number
    },
    width: {
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
      default: undefined
    },
    parameters: {
      required: false,
      type: Array,
      default: Array
    }
  },
  computed: {
    color: function () {
      return {
        fill: d3.schemeCategory10[this.index % 10]
      }
    }
  },
  methods: {
    y (y) {
      return this.yScale(y)
    }
  }
}
</script>
