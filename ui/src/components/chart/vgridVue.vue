<template>
  <g id="grid-x">
    <template v-if="isGrid">
      <line
        v-for="(x,index) in xScale.ticks(tickCount)"
        :key="index"
        :x1="xScale(x)"
        :y1="0"
        :x2="xScale(x)"
        :y2="height"
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
    height: {
      required: false,
      type: Number,
      default: 0
    },
    xScale: {
      required: false,
      type: Function,
      default: Function
    },
    tickCount: {
      required: false,
      type: Number,
      default: 5
    },
    isGrid: {
      required: false,
      type: Boolean,
      default: true
    }
  },
  watch: {
    height () {
      this.refresh()
    },
    width () {
      this.refresh()
    },
    xScale () {
      this.refresh()
    }
  },
  mounted () {
    const ko = {
      dateTime: '%Y/%m/%d %a %X',
      date: '%Y/%m/%d',
      time: '%H:%M:%S',
      periods: ['오전', '오후'],
      days: [
        '일요일',
        '월요일',
        '화요일',
        '수요일',
        '목요일',
        '금요일',
        '토요일'
      ],
      shortDays: ['일', '월', '화', '수', '목', '금', '토'],
      months: [
        '1월',
        '2월',
        '3월',
        '4월',
        '5월',
        '6월',
        '7월',
        '8월',
        '9월',
        '10월',
        '11월',
        '12월'
      ],
      shortMonths: [
        '1월',
        '2월',
        '3월',
        '4월',
        '5월',
        '6월',
        '7월',
        '8월',
        '9월',
        '10월',
        '11월',
        '12월'
      ]
    }

    d3.timeFormatDefaultLocale(ko)

    this.$nextTick(function () {
      d3.select(this.$el)
        .append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(0,' + this.height + ')')
        .append('text')
        .attr('y', -15)
        .attr('dy', '0.71em')
        .attr('fill', '#000')
        .text('time')
    })
  },
  methods: {
    refresh () {
      var self = this
      setTimeout(function () {
        d3.select(self.$el)
          .select('.axis--x')
          .attr('transform', 'translate(0,' + self.height + ')')
          .call(d3.axisBottom(self.xScale))
          .select('text')
          .attr('x', self.width + 13)
      }, 2)
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
