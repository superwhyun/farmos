<template>
  <div class="h-100">
    <svg :height="defineHeight" style="width:100%;height:100%">
      <defsVue id="detail" />
      <g id="main" :transform="'translate('+margin.left+ ','+margin.top+')'">
        <g id="grid">
          <vgridVue
            ref="vgridVue"
            :x-scale="xScale"
            :isGrid="false"
            :width="width"
            :height="height"
          />
          <hgridVue
            ref="hgridVue"
            :yScales="yScales"
            :isGrid="false"
            :yAxisData="yAxisData"
            :width="width"
          />
        </g>
        <imageVue
          v-for="(item,index) in sunLines"
          :key="index"
          :x-scale="xScale"
          :y-scale="yScale()"
          :parameters="item"
          :posY="height"
          :index="index"
          :xScaleFunction="secondToHour"
        />
        <g id="line">
          <g id="sectionLine">
            <lineVue
              v-for="(item,index) in getSections"
              :key="index"
              :x-scale="xScale"
              :y-scale="yScale()"
              :parameters="item.data"
              :index="0"
              :xScaleFunction="secondToHour"
              lineStyle="section"
              lineType="straight"
            />
          </g>
          <g id="thresholdLine">
            <lineVue
              v-for="(item,index) in chartData"
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
        <g id="bullet">
          <bulletVue
            v-for="(item,index) in chartData"
            :key="index"
            :x-scale="xScale"
            :y-scale="yScale(item.unit)"
            :parameters="item"
            :index="index"
            :xScaleFunction="secondToHour"
          />
        </g>
        <g id="circle">
          <circleTextVue
            v-for="(item,index) in chartData"
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
        <g id="title">
          <sectionTextVue
            v-for="(item,index) in getSections"
            :key="index"
            :x-scale="xScale"
            :y-scale="yScale()"
            :parameters="item"
            :posY="-10"
            :index="index"
            :xScaleFunction="secondToHour"
          />
        </g>
        <g id="legend">
          <legendVue
            v-for="(item,index) in chartData"
            :key="index"
            :index="index"
            :name="item.name"
            :posX="width"
          />
        </g>
      </g>
    </svg>
    <div class="tooltip" />
  </div>
</template>

<script>
import { addSeconds } from 'date-fns'
import vgridVue from '@/components/chart/vgridVue'
import hgridVue from '@/components/chart/hgridVue'
import lineVue from '@/components/chart/lineVue'
import bulletVue from '@/components/chart/bulletVue'
import circleTextVue from '@/components/chart/circleTextVue'
import sectionTextVue from '@/components/chart/sectionTextVue'
import imageVue from '@/components/chart/imageVue'
import legendVue from '@/components/chart/legendVue'
import defsVue from '@/components/chart/defsVue'

import * as d3 from 'd3'
import SunCalc from 'suncalc'

export default {
  components: {
    vgridVue,
    hgridVue,
    lineVue,
    bulletVue,
    circleTextVue,
    sectionTextVue,
    legendVue,
    imageVue,
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
    sections: {
      required: false
    },
    thresholds: {
      required: false
    },
    graphData: {
      required: false,
      type: Array
    },
    useds: {
      required: false
    },
    xAxisData: {
      required: true
    },
    latlng: {
      required: false
    }
  },
  data: function () {
    return {
      sunTime: {},
      sunRise: 0,
      sunSet: 0,
      chartData: [],
      difineMax: 30,
      marginAxis: 40,
      width: 0,
      height: 0
    }
  },
  computed: {
    Root: function () {
      const Root = d3.select(this.$el)
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
      this.chartData.forEach(function (element) {
        if (yAxisData[element.unit] === undefined) {
          yAxisData[element.unit] = {
            max: this.difineMax,
            min: 0
          }
        }
        let max = d3.max(element.data, function (d) {
          return d.y
        })
        if (yAxisData[element.unit]['max'] <= max) {
          yAxisData[element.unit]['max'] = Math.ceil(max / 10) * 10
        }

        let min = d3.min(element.data, function (d) {
          return d.y
        })
        if (yAxisData[element.unit]['min'] >= min) {
          yAxisData[element.unit]['min'] = -Math.ceil(min / -10) * 10
        }
        element.lineStyle = 'dash'
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
    },
    sunLines: function () {
      let sunLines = []
      if (this.sunRise) {
        sunLines.push({
          x: this.sunRise,
          type: 'rise'
        })
      }
      if (this.sunSet) {
        sunLines.push({
          x: this.sunSet,
          type: 'set'
        })
      }
      return sunLines
    },
    getSections: function () {
      let sections = []

      if (this.sections) {
        this.sections.forEach((section, sectionIdx) => {
          if (this.useds[sectionIdx]) {
            const item = {
              name: section.name,
              data: [
                {
                  x: this.transTime(section.type, section.value),
                  y: this.minValue
                },
                {
                  x: this.transTime(section.type, section.value),
                  y: this.maxValue
                }
              ]
            }
            sections.push(item)
          }
        })
      }
      return sections
    },
    maxValue () {
      var maxValue = 0
      for (var index in this.yAxisData) {
        if (maxValue < this.yAxisData[index]['max']) {
          maxValue = this.yAxisData[index]['max']
        }
      }
      return maxValue
    },
    minValue () {
      var minValue = 0
      for (var index in this.yAxisData) {
        if (minValue > this.yAxisData[index]['min']) {
          minValue = this.yAxisData[index]['min']
        }
      }
      return minValue
    }
  },
  watch: {
    thresholds () {
      if (this.sunTime) {
        this.chartDataMaker()
      }
    },
    graphData () {
      this.chartDataMaker()
    },
    latlng () {
      this.sunTimeMaker()
      this.chartDataMaker()
    }
  },
  mounted () {
    window.addEventListener('resize', this.handleWindowResize)
    this.handleWindowResize()

    this.sunTimeMaker()
    this.eventGrid()
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.handleWindowResize)
  },
  methods: {
    sunTimeMaker () {
      if (this.latlng) {
        this.sunTime = SunCalc.getTimes(
          new Date(),
          this.latlng.lat,
          this.latlng.lng
        )
        this.sunRise =
          parseInt(this.sunTime.sunrise.getHours() * 60 * 60) +
          parseInt(this.sunTime.sunrise.getMinutes() * 60)
        this.sunSet =
          parseInt(this.sunTime.sunset.getHours() * 60 * 60) +
          parseInt(this.sunTime.sunset.getMinutes() * 60)
      }
    },
    chartDataMaker () {
      this.$set(this, 'chartData', [])

      if (this.thresholds) {
        this.thresholds.forEach((threshold, thresholdIdx) => {
          let item = {
            id: threshold.id,
            name: threshold.name,
            linetype: threshold.linetype,
            unit: threshold.unit,
            data: [],
            opacity: threshold.opacity,
            xValue: threshold.xValue,
            yValue: threshold.yValue
          }

          threshold.timeoption.forEach((time, timeIdx) => {
            if (this.useds[timeIdx]) {
              item.data.push({
                isDot: true,
                x: this.transTime(
                  this.sections[timeIdx].type,
                  this.sections[timeIdx].value
                ),
                y: time.to
              })
            }
          })
          if (item.data.length > 0) {
            if (item.data[0].x > 0) {
              const data = {
                isDot: false,
                x: 0,
                y: item.data[0].y
              }
              item.data.splice(0, 0, data)
            }
          }
          this.chartData.push(item)
        })
      }

      if (this.graphData) {
        let index = 0
        this.graphData.forEach(function (element, ii) {
          element.data.forEach(function (element, i) {
            element.x = element.time
            element.y = element.value
          }, this)

          let threshold = {
            deviceId: element.id,
            name: element.name,
            linetype: element.id.toString().endsWith('00')
              ? 'step'
              : 'monotone',
            lineStyle: 'line',
            unit: element.unit,
            data: element.data,
            xValue: 0,
            yValue: 0,
            opacity: 0,
            id: index,
            sigdigit: element.sigdigit
          }
          index++
          this.chartData.push(threshold)
        }, this)
      }
    },
    transTime (type, value) {
      var newTime = ''
      var sun = ''

      if (type.indexOf('rise') >= 0) {
        sun = this.sunRise
      } else if (type.indexOf('set') >= 0) {
        sun = this.sunSet
      }

      if (type.indexOf('rise') >= 0 || type.indexOf('set') >= 0) {
        if (type.indexOf('-') >= 0) {
          newTime = Number(sun) - Number(value)
        } else if (type.indexOf('+') >= 0) {
          newTime = Number(sun) + Number(value)
        } else {
          newTime = Number(sun)
        }
      } else {
        newTime = Number(value)
      }
      return newTime
    },
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
          tooltip.transition().style('opacity', 1)
          d3.select(self.$el)
            .select('svg')
            .select('#circle')
            .selectAll('circle')
            .style('opacity', '1')
        })
        .on(
          'mouseleave',
          function () {
            tooltip.transition().style('opacity', 0)
            d3.select(self.$el)
              .select('svg')
              .select('#circle')
              .selectAll('circle')
              .style('opacity', '0')
            // d3.select(this.$el).select('svg').selectAll('#thresholdLine').style('opacity', '0')
            /* lines.forEach(function (element, i) {
              self.$set(self.chartData[i], 'opacity', 0)
            }) */
          },
          this
        )
        .on('mousemove', function () {
          var mouse = d3.mouse(this)
          mouse[0] -= self.margin.left
          if (mouse[0] < 0) {
            mouse[0] = 0
          } else if (mouse[0] >= self.width) {
            mouse[0] = self.width
          }

          var time =
            '<div style="font-weight: bold;margin: 0.25em 0;">' +
            self.$date().format(self.xScale.invert(mouse[0]), 'HH:mm') +
            '</div>'

          lines.forEach((element, i) => {
            var target = null
            var beginning = 0
            var end = element.getTotalLength()
            var pos = element.getPointAtLength(mouse[0])
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
                // self.$set(self.chartData[i], 'opacity', 1)
                break // position found
              }
            }

            self.$set(self.chartData[i], 'xValue', pos.x)
            self.$set(self.chartData[i], 'yValue', pos.y)

            const color = `color:${d3.schemeCategory10[i % 10]}`
            let value = self.yScale(self.chartData[i].unit).invert(pos.y)

            const sigdigit = Math.pow(10, self.chartData[i].sigdigit)
            time += `<div style="margin-left:5px;margin-right:5px;margin-bottom:5px;${color}">`
            if (self.chartData[i].deviceId) {
              if (self.chartData[i].deviceId.toString().endsWith('00')) {
                time += `${self.chartData[i].name} : ${
                  self.statusCode[value.toFixed(0)]
                }</div>`
              } else {
                time += `${self.chartData[i].name} : ${Math.floor(
                  value * sigdigit
                ) / sigdigit} ${
                  self.chartData[i].unit ? self.chartData[i].unit : ''
                }</div>`
              }
            }
          })

          if (tooltip.node()) {
            if (self.latlng && self.sunLines[0]) {
              var time2 = self.xScale(self.secondToHour(self.sunLines[0].x))
              if (mouse[0] >= time2 - 35 && mouse[0] <= time2 + 35) {
                time +=
                  '<div style="color: #0c6aff;">일출 : ' +
                  self
                    .$date()
                    .format(
                      self.xScale.invert(
                        self.xScale(self.secondToHour(self.sunLines[0].x))
                      ),
                      'HH:mm'
                    ) +
                  '</div>'
              }

              time2 = self.xScale(self.secondToHour(self.sunLines[1].x))
              if (mouse[0] >= time2 - 35 && mouse[0] <= time2 + 35) {
                time +=
                  '<div style="color: #ff0505;">일몰 : ' +
                  self
                    .$date()
                    .format(
                      self.xScale.invert(
                        self.xScale(self.secondToHour(self.sunLines[1].x))
                      ),
                      'HH:mm'
                    ) +
                  '</div>'
              }
            }

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
                mouse[1] + 200 +
                  'px'
              )
              .style('padding', 5 + 'px')
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
        let ys = null
        for (var index in this.yAxisData) {
          ys = d3
            .scaleLinear()
            .domain([0, this.yAxisData[index]['max']])
            .range([this.height, 0])
        }
        return ys
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
  text-align: center;
  pointer-events: none;

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
  text-align: center;
}
</style>
