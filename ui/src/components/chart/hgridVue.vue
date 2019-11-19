<template>
  <g id="grid-y">
    <template v-if="isGrid">
      <line
        v-for="y in yTicks"
        :key="y"
        :x1="0"
        :y1="yValue(y)"
        :x2="width"
        :y2="yValue(y)"
        class="grid"/>
    </template>
  </g>
</template>
<script>
import * as d3 from 'd3'
export default {
  props: {
    width: {
      required: false,
      type: Number,
      default: 0
    },
    yScales: {
      required: false,
      type: Object,
      default: Object
    },
    yAxisData: {
      required: false,
      type: Object,
      default: Object
    },
    tickCount: {
      required: false,
      type: Number,
      default: 5
    },
    marginAxis: {
      required: false,
      type: Number,
      default: 40
    },
    isGrid: {
      required: false,
      type: Boolean,
      default: true
    }
  },
  data () {
    return {}
  },
  computed: {
    yTicks: function () {
      if (this.yScale !== undefined) {
        return this.yScale.ticks(this.tickCount)
      }
      return null
    }
  },
  watch: {
    yAxisData: function (val) {
      this.refresh()
    }
  },
  mounted () {
    this.refresh()
    window.addEventListener('resize', this.handleWindowResize)
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.handleWindowResize)
  },
  methods: {
    handleWindowResize () {
      var self = this
      setTimeout(function () {
        var index = 0
        d3.select(self.$el).html('')
        for (var id in self.yAxisData) {
          d3
            .select(self.$el)
            .append('g')
            .attr('class', 'axis axis--y')
            .attr('id', id)
            .attr('transform', 'translate(' + index * -self.marginAxis + ',0)')
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -5)
            .attr('y', 5)
            .attr('dy', '0.71em')
            .attr('fill', '#000')
            .text(id)
          index++
        }
        d3
          .select(self.$el)
          .selectAll('.axis--y')
          .each(function () {
            d3
              .select(this)
              .call(
                d3.axisLeft(
                  self.yAxisData[d3.select(this).attr('id')]['yScale']
                )
              )
          })
      }, 2)
    },
    yValue: function (y) {
      return this.yScale(y)
    },
    refresh () {
      this.handleWindowResize()
    }
  }
}
</script>

<style scoped>
line {
  stroke: lightgrey;
  stroke-opacity: 0.2;
  stroke-width: 1px;
  shape-rendering: crispEdges;
}
</style>
