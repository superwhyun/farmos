<template>
  <div>
    <div style="display: flex;">
      <div>{{name}}</div>
      <div class="ml-auto el-icon-setting" style="z-index: 1;" @click="showDialog = true"></div>
    </div>
    <lineChart
      :id="'line'"
      :defineHeight="100"
      :latlng="{lat: field.data.lat.value,lng: field.data.lng.value}"
      :sections="getChartData.sections"
      :thresholds="getChartData.thresholds"
      :useds="getChartData.useds"
      :xAxisData="getChartData.xAxisData"
      :graphData="chartData"
    ></lineChart>
    <!-- :graphData="chart.graphDatas['left'][house.id] && chart.graphDatas['left'][house.id].data ? chart.graphDatas['left'][house.id].data : []" -->
    <Transfer
      :fieldId="field.id"
      :path="['dashboard',uiType]"
      :uiInfo="uiInfo[uiType]"
      :devices="sensor"
      :showDialog="showDialog"
      :closeDialog="()=>showDialog = false"
      :refresh="getGraphDat"
    />
  </div>
</template>

<script>
import { addDays } from 'date-fns'
import LineChart from '@/components/LineChart'
import Transfer from '@/components/Transfer'
export default {
  props: ['field', 'uiInfo', 'uiType', 'sensor', 'name', 'obs'],
  components: {
    Transfer,
    LineChart
  },
  data () {
    return {
      showDialog: false,
      timeSpan: {},
      chartData: [],
      today: new Date()
    }
  },
  computed: {
    getChartData () {
      let chartData = {
        thresholds: [],
        sections: [],
        useds: [],
        graphData: [],
        xAxisData: {
          min: this.$date().format(this.today, 'YYYY-MM-DD'),
          max: this.$date().format(addDays(this.today, 1), 'YYYY-MM-DD')
        }
      }

      if (this.timeSpan.timespan) {
        chartData.sections = this.timeSpan.timespan.parts
        chartData.thresholds = this.timeSpan.timespan.threshold
        this.timeSpan.timespan.parts.forEach(element => {
          chartData.useds.push(true)
        })
      }
      return chartData
    }
  },
  mounted () {
    this.getTimeSpan()
    this.getGraphDat()
  },
  methods: {
    async getTimeSpan () {
      try {
        const { data } = await this.axios.get(
          `/rule/timespan/1/field/${this.field.id}`
        )
        this.$set(this, 'timeSpan', data)
      } catch (error) {
        console.log(error)
      }
    },
    getGraphDat () {
      let ids = []
      for (const key in this.uiInfo[this.uiType].device) {
        for (const id of this.uiInfo[this.uiType].device[key]) {
          ids.push(id)
        }
      }
      this.getGraph(
        [this.today, addDays(this.today, 1)],
        ids
      )
    },
    async getGraph (date, searchItems) {
      const { data } = await this.axios.put('farm/graph', {
        device_id: searchItems.map(Number),
        startdate: this.$date().format(date[0], 'YYYY-MM-DD'),
        enddate: this.$date().format(date[1], 'YYYY-MM-DD')
      })

      for (const element of data.data) {
        if (element.id.toString().startsWith('1')) {
          for (const device of this.sensor) {
            for (const data of device.datas) {
              if (data.id === element.id) {
                element.name = device.name + ' ' + element.name
                break
              }
            }
          }
        }
        element.sigdigit = this.obs[element.id].sigdigit
      }
      this.$set(this, 'chartData', data.data)
    }
  }
}
</script>

<style>
</style>
