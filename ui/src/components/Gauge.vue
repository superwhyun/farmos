<template>
  <div ref="chartdiv"></div>
</template>

<script>
import * as am4core from '@amcharts/amcharts4/core'
import * as am4charts from '@amcharts/amcharts4/charts'
import am4themesAnimated from '@amcharts/amcharts4/themes/animated'

am4core.useTheme(am4themesAnimated)

export default {
  props: ['value'],
  data () {
    return {
      hand: Function
    }
  },
  watch: {
    value (newValue, oldValue) {
      this.hand.showValue(this.value, 1000, am4core.ease.cubicOut)
    }
  },
  mounted () {
    let chart = am4core.create(this.$refs.chartdiv, am4charts.GaugeChart)
    chart.innerRadius = am4core.percent(90)

    chart.hiddenState.properties.opacity = 0

    let axis = chart.xAxes.push(new am4charts.ValueAxis())
    axis.min = 0
    axis.max = 100
    axis.strictMinMax = true
    axis.renderer.inside = false
    axis.renderer.radius = am4core.percent(97)
    axis.renderer.line.strokeOpacity = 1
    axis.renderer.line.strokeWidth = 1
    axis.renderer.line.stroke = chart.colors.getIndex(0)
    axis.renderer.ticks.template.disabled = false
    axis.renderer.ticks.template.stroke = chart.colors.getIndex(0)
    axis.renderer.ticks.template.strokeOpacity = 1
    axis.renderer.grid.template.disabled = true
    axis.renderer.ticks.template.length = 10
    axis.hiddenState.properties.opacity = 1
    axis.hiddenState.properties.visible = true
    axis.setStateOnChildren = true
    axis.renderer.hiddenState.properties.endAngle = 180

    /**
     * Axis for ranges
     */

    let colorSet = new am4core.ColorSet()

    let axis2 = chart.xAxes.push(new am4charts.ValueAxis())
    axis2.min = 0
    axis2.max = 100
    axis2.renderer.innerRadius = 10
    axis2.strictMinMax = true
    axis2.renderer.labels.template.disabled = true
    axis2.renderer.ticks.template.disabled = true
    axis2.renderer.grid.template.disabled = true

    let range0 = axis2.axisRanges.create()
    range0.value = 0
    range0.endValue = 50
    range0.axisFill.fillOpacity = 1
    range0.axisFill.fill = colorSet.getIndex(0)

    let range1 = axis2.axisRanges.create()
    range1.value = 50
    range1.endValue = 100
    range1.axisFill.fillOpacity = 1
    range1.axisFill.fill = colorSet.getIndex(8)

    /**
     * Label
     */

    var label = chart.radarContainer.createChild(am4core.Label)
    label.fontSize = 20
    label.horizontalCenter = 'middle'
    label.verticalCenter = 'bottom'
    label.padding(10, 10, 30, 10)
    label.text = '%'

    /**
     * Hand
     */
    this.hand = chart.hands.push(new am4charts.ClockHand())
    this.hand.fill = axis.renderer.line.stroke
    this.hand.stroke = axis.renderer.line.stroke
    this.hand.axis = axis2
    this.hand.pin.radius = 5
    this.hand.startWidth = 5

    this.hand.events.on('propertychanged', function (ev) {
      range0.endValue = ev.target.value
      range1.value = ev.target.value
      label.text = Math.floor(ev.target.value) + ' %'
      axis2.invalidate()
    })

    this.hand.showValue(this.value, 1000, am4core.ease.cubicOut)
  },

  beforeDestroy () {
    if (this.chart) {
      this.chart.dispose()
    }
  }
}
</script>

<style scoped>
</style>
