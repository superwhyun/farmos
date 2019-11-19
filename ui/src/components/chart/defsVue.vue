<template>
  <defs/>
</template>
<script>
var d3 = require('d3')
export default {
  props: {
    id: {
      required: false,
      type: String,
      default: String
    }
  },
  mounted () {
    var defs = d3.select(this.$el)
    var id = this.id
    defs
      .append('pattern')
      .attr('id', 'diagonalHatch' + id)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 4)
      .attr('height', 4)
      .append('path')
      .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
      .attr('stroke', 'blue')
      .attr('stroke-width', 1)
      .attr('opacity', 0.3)

    var shadow = defs
      .append('filter')
      .attr('id', 'dropshadow' + id)
      .attr('width', '130%')
      .attr('height', '130%')

    shadow
      .append('feOffset')
      .attr('dx', -1)
      .attr('dy', 1)
      .attr('result', 'offset')

    shadow
      .append('feColorMatrix')
      .attr('in', 'offset')
      .attr('result', 'matrix')
      .attr('type', 'matrix')
      .attr('values', '0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0')

    shadow
      .append('feGaussianBlur')
      .attr('in', 'matrix') /* matrix */
      .attr('result', 'blur')
      .attr('stdDeviation', 3)

    shadow
      .append('feBlend')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('mode', 'normal')
  }
}
</script>

<style scoped>
.grid {
  stroke: #bbb;
  stroke-width: 1px;
}
</style>
