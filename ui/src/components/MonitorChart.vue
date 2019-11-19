<template>
  <div class="h-100">
    <svg :height="defineHeight" class="h-100 w-100">
      <defsVue :id="id" />
      <g id="main" :transform="'translate('+margin.left+ ','+margin.top+')'">
        <g id="grid">
          <vgridVue
            ref="vgridVue"
            :x-scale="xScale"
            :isGrid="true"
            :width="width"
            :height="height"
          />
          <hgridVue
            ref="hgridVue"
            :yScales="yScales"
            :isGrid="true"
            :yAxisData="yAxisData"
            :width="width"
          />
        </g>
        <g id="line">
          <g id="thresholdLine">
            <lineVue
              v-for="(item,index) in thresholds"
              :lineStyle="item.lineStyle"
              :lineType="item.linetype"
              :key="item.id"
              :x-scale="xScale"
              :y-scale="yScale(item.unit)"
              :parameters="item.data"
              :index="index"
              :xScaleFunction="secondToHour"
            />
          </g>
        </g>
        <g id="circle">
          <circleTextVue
            v-for="(item,index) in thresholds"
            :key="item.id"
            :x-scale="xScale"
            :y-scale="yScale(item.unit)"
            :xValue="item.xValue"
            :opacity="item.opacity"
            :yValue="item.yValue"
            :index="index"
            :unit="item.unit"
            :deviceId="item.deviceId"
          />
        </g>
        <g id="legend">
          <legendVue
            v-for="(item,index) in thresholds"
            :key="index"
            :index="index"
            :name="item.name"
            :posX="width"
          />
        </g>
      </g>
    </svg>
  </div>
</template>

<script>
import { addSeconds } from 'date-fns'
import vgridVue from '@/components/chart/vgridVue'
import hgridVue from '@/components/chart/hgridVue'
import lineVue from '@/components/chart/lineVue'
import circleTextVue from '@/components/chart/circleTextVue'
import legendVue from '@/components/chart/legendVue'
import defsVue from '@/components/chart/defsVue'
import { statusCode } from '@/constants/config'

import * as d3 from 'd3'

export default {
  layout: 'dashboard',
  components: {
    vgridVue,
    hgridVue,
    lineVue,
    circleTextVue,
    legendVue,
    defsVue
  },
  props: {
    defineHeight: {
      required: false,
      type: Number,
      default: 366
    },
    id: {
      required: true,
      type: String
    },
    xAxisData: {
      type: Object,
      required: true
    },
    graphData: {
      required: true,
      type: Array
    }
  },
  data: function () {
    return {
      difineMax: 30,
      marginAxis: 40,
      width: 0,
      height: 0,
      thresholds: []
    }
  },
  computed: {
    Root: function () {
      const Root = d3.select(this.$el)
      Root.append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
      return Root
    },
    Svg: function () {
      return this.Root.select('svg')
    },
    Ggrid: function () {
      return this.Svg.select('.grid')
    },
    svgWidth: function () {
      return this.width + this.margin.left + this.margin.right
    },
    svgHeight: function () {
      return this.height + this.margin.top + this.margin.bottom
    },
    xScale: function () {
      return d3
        .scaleTime()
        .domain([
          this.$date().parse(this.xAxisData.min),
          this.$date().parse(this.xAxisData.max)
        ])
        .range([0, this.width])
    },
    yScales: function () {
      let yScales = this.yAxisData
      for (var index in this.yAxisData) {
        yScales[index]['yScale'] = d3
          .scaleLinear()
          .domain([this.yAxisData[index]['min'], this.yAxisData[index]['max']])
          .range([this.height, 0])
      }
      return yScales
    },
    yAxisData: function () {
      let yAxisData = {}
      this.thresholds.forEach(function (element) {
        if (yAxisData[element.unit] === undefined) {
          yAxisData[element.unit] = {
            max: this.difineMax,
            min: 0
          }
        }
        let max = d3.max(element.data, function (d) {
          return d.value
        })
        if (yAxisData[element.unit]['max'] <= max) {
          yAxisData[element.unit]['max'] = Math.ceil(max / 10) * 10
        }

        let min = d3.min(element.data, function (d) {
          return d.value
        })
        if (yAxisData[element.unit]['min'] >= min) {
          if (min >= 0) {
            yAxisData[element.unit]['min'] = 0
          } else {
            yAxisData[element.unit]['min'] = -Math.ceil(min / -10) * 10
          }
        }
        element.lineStyle = 'dash'
        element.linetype = 'monotone'
        element.dotEnable = false
      }, this)
      this.handleWindowResize()
      return yAxisData
    },
    margin () {
      let margin = {
        top: 30,
        right: 40,
        bottom: 20,
        left:
          Object.keys(this.yAxisData).length <= 0
            ? this.marginAxis
            : Object.keys(this.yAxisData).length * this.marginAxis
      }
      return margin
    }
  },
  watch: {
    graphData () {
      let thresholds = []
      let index = 0
      this.graphData.forEach(function (element, ii) {
        element.data.forEach(function (element, i) {
          element.x = element.time
          element.y = element.value
        }, this)

        let threshold = {
          device_id: element.device_id,
          name: element.name,
          linetype: element.id.toString().endsWith('00') ? 'step' : 'monotone',
          lineStyle: 'line',
          unit: element.unit,
          data: element.data,
          xValue: 0,
          yValue: 0,
          opacity: 0,
          id: index,
          sigdigit: element.sigdigit,
          deviceId: element.id
        }
        index++
        thresholds.push(threshold)
      }, this)
      this.thresholds = thresholds
    }
  },
  mounted () {
    window.addEventListener('resize', this.handleWindowResize)
    this.handleWindowResize()

    this.eventGrid()
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.handleWindowResize)
  },
  methods: {
    eventGrid () {
      var lines = d3
        .select(this.$el)
        .select('svg')
        .selectAll('#thresholdLine')
        .node().childNodes
      var tooltip = this.Root.selectAll('.tooltip')
      var self = this

      this.$nextTick(function () {
        d3.select(this.$el)
          .select('svg')
          .selectAll('.dot')
          .on('click', function (d) {
            d3.selectAll('.active').classed('active', false)
            d3.select(this).classed('active', true)

            d3.select(this)
              .transition()
              .duration(400)
              .attr('r', 50)
              .transition()
              .duration(400)
              .attr('r', 7)

            var time = self
              .$date()
              .format(
                self.secondToHour(d3.select(this).attr('x')).toFixed(2),
                'MM-DD HH:mm'
              )

            var ss =
              time +
              '<br>' +
              d3.select(this).attr('name') +
              ' : ' +
              d3.select(this).attr('y') +
              '<br>'
            tooltip.html(ss)
          })
      })
      d3.select(this.$el)
        .select('svg')
        .on('mouseover', function () {
          d3.select(self.$el)
            .select('svg')
            .select('#circle')
            .selectAll('circle')
            .style('opacity', '1')
          tooltip.transition().style('opacity', 1)
        })
      d3.select(this.$el).on(
        'mouseleave',
        function () {
          d3.select(self.$el)
            .select('svg')
            .select('#circle')
            .selectAll('circle')
            .style('opacity', '0')
          tooltip.transition().style('opacity', 0)
          lines.forEach(function (element, i) {
            self.thresholds[i].opacity = 0
          })
        },
        this
      )

      d3.select(this.$el).on('mousemove', function () {
        var mouse = d3.mouse(this)
        mouse[0] -= self.margin.left
        if (mouse[0] < 0) {
          mouse[0] = 0
        } else if (mouse[0] >= self.width) {
          mouse[0] = self.width
        }

        var time = `<div style="margin-top:10px;margin-bottom:10px;text-align: center;font-weight: bold;">
          ${self
    .$date()
    .format(self.xScale.invert(mouse[0]), 'M/D HH:mm')}</div>`

        lines.forEach((element, i) => {
          var pos = element.getPointAtLength(mouse[0])
          var beginning = 0
          var end = element.getTotalLength()
          var target = null

          while (true) {
            target = Math.floor((beginning + end) / 2)
            pos = element.getPointAtLength(target)

            if (
              (target === end || target === beginning) &&
              pos.x !== mouse[0]
            ) {
              break
            }
            if (pos.x > mouse[0]) end = target
            else if (pos.x < mouse[0]) beginning = target
            else {
              // self.thresholds[i].opacity = 1
              break // position found
            }
          }
          self.$set(self.thresholds[i], 'xValue', pos.x)
          self.$set(self.thresholds[i], 'yValue', pos.y)

          const color = `color:${d3.schemeCategory10[i % 10]}`
          let value = self.yScale(self.thresholds[i].unit).invert(pos.y)
          const sigdigit = Math.pow(10, self.thresholds[i].sigdigit)
          time += `<div style="margin-left:5px;margin-right:5px;margin-bottom:5px;${color}">`
          if (self.thresholds[i].deviceId.toString().endsWith('00')) {
            time += `${self.thresholds[i].name} : ${
              statusCode[value.toFixed(0)]
            }</div>`
          } else {
            time += `${self.thresholds[i].name} : ${Math.floor(
              value * sigdigit
            ) / sigdigit} ${self.thresholds[i].unit}</div>`
          }
        })

        if (tooltip.node()) {
          let tooltipX = 0
          if (mouse[0] < tooltip.node().getBoundingClientRect().width) {
            tooltipX = mouse[0] + self.margin.left + 60 + 'px'
          } else {
            tooltipX =
              mouse[0] +
              self.margin.left -
              tooltip.node().getBoundingClientRect().width -
              20 +
              'px'
          }

          tooltip
            .html(time)
            .style('left', tooltipX)
            .style(
              'top',
              mouse[1] -
                tooltip.node().getBoundingClientRect().height / 2 +
                'px'
            )
            .style('padding', 2 + 'px')
        }
      })
    },
    handleWindowResize () {
      this.getSize()
    },
    getSize () {
      setTimeout(() => {
        this.width =
          this.$el.clientWidth - this.margin.left - this.margin.right
        this.height =
          this.$el.clientHeight - this.margin.top - this.margin.bottom
      }, 1)
    },
    yScale (unit) {
      if (unit !== undefined && this.yAxisData[unit]) {
        return d3
          .scaleLinear()
          .domain([this.yAxisData[unit]['min'], this.yAxisData[unit]['max']])
          .range([this.height, 0])
      } else {
        for (var index in this.yAxisData) {
          return d3
            .scaleLinear()
            .domain([
              this.yAxisData[index]['min'],
              this.yAxisData[index]['max']
            ])
            .range([this.height, 0])
        }
      }
    },
    secondToHour (seconds) {
      return addSeconds(this.xAxisData.min, seconds)
    }
  }
}
</script>

<style >
div.tooltip {
  position: absolute;
  /* text-align: center; */

  /* width: auto;
  height: auto;
  padding: 2px;
  font: 12px sans-serif;
  background: lightsteelblue;
  border: 0px;
  border-radius: 8px;
  pointer-events: none; */

  border-radius: 10px;
  padding: 6px;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  border: solid 2px rgba(230, 230, 230, 0.8);
  font-size: 14px;
}
</style>
