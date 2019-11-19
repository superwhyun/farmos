<template>
  <g>
    <rect
      :x="posX-20"
      :y="index * 20 + 10"
      :width="10"
      :height="10"
      :style="color"/>
    <text
      :x="posX-30"
      :y="index * 20 +9.5 + 10"
      :style="color"
      style="text-anchor :end">
      {{ name }}
    </text>
  </g>
</template>

<script>
import * as d3 from 'd3'
export default {
  props: {
    index: {
      required: false,
      type: Number,
      default: Number
    },
    posX: {
      required: false,
      type: Number,
      default: Number
    },
    name: {
      required: false,
      type: String,
      default: String
    }
  },
  computed: {
    color: function () {
      return {
        fill: d3.schemeCategory10[this.index % 10]
      }
    }
  }
}
</script>

<style scoped>
</style>
