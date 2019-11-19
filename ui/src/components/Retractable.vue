<template>
  <div style="height:100%">
    <div style="display: flex;">
      <div>개폐기 상태</div>
      <div class="ml-auto el-icon-setting" style="z-index: 1;" @click="showDialog = true"></div>
    </div>
    <div v-if="showChart" ref="chartdiv" style="height:90%"></div>
    <div v-else>개폐기 데이터를 선택 하세요</div>
    <Transfer
      :fieldId="fieldId"
      :path="['dashboard',path]"
      :uiInfo="uiInfo"
      :devices="item"
      :showDialog="showDialog"
      :closeDialog="()=>showDialog = false"
    />
  </div>
</template>

<script>
import Transfer from '@/components/Transfer'
import * as am4core from '@amcharts/amcharts4/core'
import * as am4charts from '@amcharts/amcharts4/charts'
import am4themesAnimated from '@amcharts/amcharts4/themes/animated'

am4core.useTheme(am4themesAnimated)

export default {
  components: {
    Transfer
  },
  props: ['fieldId', 'uiInfo', 'obs', 'device', 'item', 'path'],
  data () {
    return {
      chart: Function,
      showDialog: false,
      showChart: false
    }
  },
  watch: {
    async uiInfo (newValue, oldValue) {
      await this.makeChart()
      await this.makeData()
    },
    obs: {
      deep: true,
      handler () {
        this.makeData()
      }
    },
    device: {
      deep: true,
      handler () {
        this.makeData()
      }
    }
    /* obs (newValue, oldValue) {
      this.makeData()
    },
    device (newValue, oldValue) {
      this.makeData()
    } */
  },
  methods: {
    async makeChart () {
      if (Object.values(this.uiInfo['ratio'].device).length === 0) {
        this.showChart = false
        return
      } else {
        this.showChart = true
      }

      await this.$nextTick()

      this.chart = am4core.create(this.$refs.chartdiv, am4charts.RadarChart)

      // Add data
      this.chart.data = []

      // Make chart not full circle
      this.chart.startAngle = -90
      this.chart.endAngle = 180
      this.chart.innerRadius = am4core.percent(30)

      // Set number format
      this.chart.numberFormatter.numberFormat = "#.#'%'"

      // Create axes
      var categoryAxis = this.chart.yAxes.push(new am4charts.CategoryAxis())
      categoryAxis.dataFields.category = 'category'
      categoryAxis.renderer.grid.template.location = 0
      categoryAxis.renderer.grid.template.strokeOpacity = 0
      categoryAxis.renderer.labels.template.horizontalCenter = 'right'
      categoryAxis.renderer.labels.template.fontWeight = 500
      categoryAxis.renderer.labels.template.adapter.add(
        'fill',
        (fill, target) => {
          return target.dataItem.index >= 0
            ? this.chart.colors.getIndex(target.dataItem.index)
            : fill
        }
      )
      categoryAxis.renderer.minGridDistance = 10

      var valueAxis = this.chart.xAxes.push(new am4charts.ValueAxis())
      valueAxis.renderer.grid.template.strokeOpacity = 0
      valueAxis.min = 0
      valueAxis.max = 100
      valueAxis.strictMinMax = true

      // Create series
      var series1 = this.chart.series.push(new am4charts.RadarColumnSeries())
      series1.dataFields.valueX = 'full'
      series1.dataFields.categoryY = 'category'
      series1.clustered = false
      series1.columns.template.fill = new am4core.InterfaceColorSet().getFor(
        'alternativeBackground'
      )
      series1.columns.template.fillOpacity = 0.08
      series1.columns.template.cornerRadiusTopLeft = 20
      series1.columns.template.strokeWidth = 0
      series1.columns.template.radarColumn.cornerRadius = 5

      var series2 = this.chart.series.push(new am4charts.RadarColumnSeries())
      series2.dataFields.valueX = 'value'
      series2.dataFields.categoryY = 'category'
      series2.clustered = false
      series2.columns.template.strokeWidth = 0
      series2.columns.template.tooltipText = '{category}: [bold]{value}[/]'
      series2.columns.template.radarColumn.cornerRadius = 5

      series2.columns.template.adapter.add('fill', (fill, target) => {
        return this.chart.colors.getIndex(target.dataItem.index)
      })
    },
    makeData () {
      let data = []
      for (const key in this.uiInfo['ratio'].device) {
        let name = ''
        for (const device of this.device) {
          // eslint-disable-next-line eqeqeq
          if (device.id == key) {
            name = device.name
            break
          }
        }
        data.push({
          category: name,
          value: this.obs[this.uiInfo['ratio'].device[key][0]].nvalue,
          full: 100
        })
      }
      this.chart.data = data
    }
  },
  async mounted () {
    await this.makeChart()
    await this.makeData()
  },
  beforeDestroy () {
    if (this.chart) {
      this.chart.dispose()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
