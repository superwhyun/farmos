<template>
  <div style="height:100%">
    <div style="display: flex;">
      <div>{{path === 'retractable' ? '개폐기 상태' : '스위치 상태' }}</div>
      <div class="ml-auto el-icon-setting" style="z-index: 1;" @click="showDialog = true"></div>
    </div>
    <div v-if="showChart" ref="chartdiv" style="height:90%"></div>
    <div v-else>스위치 데이터를 선택 하세요</div>
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
  props: ['fieldId', 'uiInfo', 'obs', 'device', 'item', 'path', 'type'],
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
      let tempData = null
      if (this.type) {
        tempData = this.uiInfo[this.type]
      } else {
        tempData = this.uiInfo
      }

      if (Object.values(tempData).length === 0) {
        this.showChart = false
        return
      } else {
        this.showChart = true
      }

      await this.$nextTick()
      this.chart = am4core.create(this.$refs.chartdiv, am4charts.XYChart3D)

      // Create axes
      let categoryAxis = this.chart.yAxes.push(new am4charts.CategoryAxis())
      categoryAxis.dataFields.category = 'category'
      categoryAxis.numberFormatter.numberFormat = '#'
      categoryAxis.renderer.inversed = true

      let valueAxis = this.chart.xAxes.push(new am4charts.ValueAxis())
      valueAxis.min = 0
      this.chart.xAxes.push(valueAxis)

      // Create series
      let series = this.chart.series.push(new am4charts.ColumnSeries3D())
      series.dataFields.valueX = 'end'
      series.dataFields.categoryY = 'category'
      series.name = ''
      series.columns.template.propertyFields.fill = 'color'
      series.columns.template.tooltipText =
        '{category} {name}: [bold]{valueX}[/]'
      series.columns.template.column3D.stroke = am4core.color('#fff')
      series.columns.template.column3D.strokeOpacity = 0.2

      let valueLabel = series.bullets.push(new am4charts.LabelBullet())
      valueLabel.label.text = '{name}'
      valueLabel.label.horizontalCenter = 'left'
      valueLabel.label.dx = 0
      valueLabel.label.fill = am4core.color('#fff')
      valueLabel.label.hideOversized = false
      valueLabel.label.truncate = false

      let categoryLabel = series.bullets.push(new am4charts.LabelBullet())
      categoryLabel.label.text = '{end}'
      categoryLabel.label.horizontalCenter = 'right'
      categoryLabel.label.dx = -10
      categoryLabel.label.hideOversized = false
      categoryLabel.label.fill = am4core.color('#fff')
      categoryLabel.label.truncate = false
    },
    makeData () {
      let tempData = null
      if (this.type) {
        tempData = this.uiInfo[this.type]
      } else {
        tempData = this.uiInfo
      }

      let data = []
      for (const key in tempData.device) {
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
          value: this.obs[tempData.device[key][0]].nvalue,
          full: 100
        })
        data.push({
          category: name,
          end: this.obs[tempData.device[key][0]].nvalue,
          color: this.chart.colors.next(),
          color2: this.chart.colors.next()
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
