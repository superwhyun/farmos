<template>
  <div class="col-xxs-12 mx-auto my-auto" style="padding:15px">
    <h4 class="c-grey-900 mB-30">데이터 조회</h4>

    <b-row class="mb-2">
      <b-col xs="12" lg="6">
        <b-card-body class="p-0">
          <el-collapse v-model="activeName">
            <el-collapse-item title="검색 조건" name="1">
              <el-form label-position="left" label-width="100px">
                <el-form-item label="온실">
                  <el-select v-model="searchOne.field" placeholder="Select">
                    <el-option
                      v-for="item in getFields"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    ></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="기간">
                  <el-date-picker
                    v-model="searchOne.date"
                    type="daterange"
                    range-separator="~"
                    start-placeholder="시작일"
                    end-placeholder="종료일"
                  ></el-date-picker>
                </el-form-item>
                <el-form-item label="데이터">
                  <el-select v-model="searchOne.data" multiple placeholder="Select">
                    <el-option
                      v-for="item in fieldData[searchOne.field]"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </el-form>
            </el-collapse-item>
          </el-collapse>
        </b-card-body>
      </b-col>
      <b-col xs="12" lg="6">
        <b-card-body class="p-0">
          <el-collapse v-model="activeName">
            <el-collapse-item title="비교 조건" name="1">
              <el-form label-position="left" label-width="100px">
                <el-form-item label="온실">
                  <el-select v-model="searchTwo.field" placeholder="Select">
                    <el-option
                      v-for="item in getFields"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    ></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="기간">
                  <el-date-picker
                    v-model="searchTwo.date"
                    type="daterange"
                    range-separator="~"
                    start-placeholder="시작일"
                    end-placeholder="종료일"
                  ></el-date-picker>
                </el-form-item>
                <el-form-item label="데이터">
                  <el-select v-model="searchTwo.data" multiple placeholder="Select">
                    <el-option
                      v-for="item in fieldData[searchTwo.field]"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </el-form>
            </el-collapse-item>
          </el-collapse>
        </b-card-body>
      </b-col>
    </b-row>
    <b-row>
      <b-col lg="6">
        <el-button
          class="w-100 mt-1 mb-4"
          icon="el-icon-search"
          @click="search(false)"
          type="primary"
          plain
        >조회</el-button>
      </b-col>
      <b-col lg="6">
        <el-button
          class="w-100 mt-1 mb-4"
          icon="el-icon-search"
          @click="search(true)"
          type="success"
          plain
        >다운로드</el-button>
      </b-col>
    </b-row>
    <b-row class="h-100">
      <b-col lg="12" class="h-100">
        <b-card no-body class="h-100" header="차트">
          <b-card-body ref="chartBody" class="h-100">
            <MonitorChart id="load" :graph-data="chartData" :x-axis-data="xAxisData" />
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import MonitorChart from '@/components/MonitorChart'
import { addDays, isBefore, differenceInSeconds } from 'date-fns'
import { mapGetters } from 'vuex'
import downloadjs from 'downloadjs'
const iconv = require('iconv-lite')

export default {
  components: {
    MonitorChart
  },
  watch: {
    'searchOne.field' (newValue, oldValue) {
      this.$set(this.searchOne, 'data', [])
    },
    'searchTwo.field' (newValue, oldValue) {
      this.$set(this.searchTwo, 'data', [])
    }
  },
  data () {
    return {
      activeName: '1',
      searchOne: {
        field: '',
        date: [],
        data: []
      },
      searchTwo: {
        field: '',
        date: [],
        data: []
      },
      xAxisData: {
        min: '',
        max: ''
      },
      chartData: []
    }
  },
  computed: {
    ...mapGetters({
      getFields: 'field/getFields',
      getAllFieldDevices: 'device/getAllFieldDevices',
      getDataIndexList: 'dataIndex/getDataIndexList'
    }),

    fieldData () {
      let dataItems = {}
      for (const key in this.getAllFieldDevices) {
        if (this.getAllFieldDevices.hasOwnProperty(key)) {
          dataItems[key] = []
          const devics = this.getAllFieldDevices[key]
          for (const device of devics) {
            for (const data of device.datas) {
              dataItems[key].push({
                id: data.id,
                name:
                  (device.name ? device.name : device.spec.Name) +
                  ' ' +
                  data.name,
                sigdigit: data.sigdigit
              })
            }
          }

          for (const dataIndex of this.getDataIndexList) {
          // eslint-disable-next-line eqeqeq
            if (dataIndex.field_id == key &&
            dataIndex.id > 30000000 &&
            String(dataIndex.id).lastIndexOf('0') !==
              String(dataIndex.id).length - 1
            ) {
              dataItems[key].push({
                id: dataIndex.id,
                name: dataIndex.name,
                sigdigit: dataIndex.sigdigit
              })
            }
          }
        }
      }
      return dataItems
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    init () {
      var today = new Date()
      let date = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0
      )

      this.searchOne.date.push(this.$date().format(date))
      this.searchOne.date.push(this.$date().format(date))
      this.searchTwo.date.push(this.$date().format(date))
      this.searchTwo.date.push(this.$date().format(date))

      this.xAxisData.min = this.searchOne.date[0]
      this.xAxisData.max = addDays(this.searchOne.date[1], 1)
    },
    async getGraph (date, searchItems) {
      const { data } = await this.axios.put('farm/graph', {
        device_id: searchItems.map(Number),
        startdate: this.$date().format(date[0], 'YYYY-MM-DD'),
        enddate: this.$date().format(addDays(date[1], 1), 'YYYY-MM-DD')
      })
      return data.data
    },
    async searchDownload (date, searchItems) {
      let temp = await this.axios.put('/farm/graph/download', {
        device_id: searchItems.map(Number),
        startdate: this.$date().format(date[0], 'YYYY-MM-DD'),
        enddate: this.$date().format(addDays(date[1], 1), 'YYYY-MM-DD')
      })

      if (temp) {
        if (temp.status === 200) {
          let disposition = temp.headers['content-disposition']
          if (disposition && disposition.indexOf('attachment') !== -1) {
            var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
            var matches = filenameRegex.exec(disposition)
            if (matches != null && matches[1]) {
              const filename = matches[1].replace(/['"]/g, '')
              downloadjs(
                iconv.encode(temp.data, 'utf8', { addBOM: true }).toString(),
                filename,
                'text/csv'
              )
              console.log(temp.data)
            }
          }
        }
      } else {
      }
    },
    async search (isDown) {
      this.chartData = []

      let chartOneData = []
      let chartTwoData = []

      let isOneData = false
      let isTwoData = false

      if (this.searchOne.field !== '' && this.searchOne.data.length > 0) {
        const data = await this.getGraph(
          this.searchOne.date,
          this.searchOne.data
        )

        if (isDown) {
          await this.searchDownload(this.searchOne.date, this.searchOne.data)
        }

        for (const element of data) {
          const field = this.getFields.find(field => {
            return field.id === this.searchOne.field
          })

          element.name = field.name + '_'
          for (const item of this.fieldData[this.searchOne.field]) {
            if (item.id === element.id) {
              element.name += item.name
              element.sigdigit = item.sigdigit
              break
            }
          }
          // chartOneData = element
          chartOneData.push(element)

          if (element.data.length > 0) {
            isOneData = true
          }
        }
      }

      if (this.searchTwo.field !== '' && this.searchTwo.data.length > 0) {
        const data = await this.getGraph(
          this.searchTwo.date,
          this.searchTwo.data
        )

        if (isDown) {
          await this.searchDownload(this.searchTwo.date, this.searchTwo.data)
        }

        for (const element of data) {
          const field = this.getFields.find(field => {
            return field.id === this.searchTwo.field
          })

          element.name = field.name + '_'
          for (const item of this.fieldData[this.searchTwo.field]) {
            if (item.id === element.id) {
              element.name += item.name
              element.sigdigit = item.sigdigit
              break
            }
          }
          chartTwoData.push(element)

          if (element.data.length > 0) {
            isTwoData = true
          }
        }
      }

      if (isTwoData) {
        if (isOneData && isBefore(this.searchTwo.date[0], this.searchOne.date[0])) {
          const second = differenceInSeconds(
            this.searchOne.date[0],
            this.searchTwo.date[0]
          )

          chartOneData.forEach(element => {
            element.data.forEach(element => {
              element.time = second + Number(element.time)
            })
          })
        }
        this.chartData = this.chartData.concat(chartTwoData)
      }

      if (isOneData) {
        if (isTwoData && isBefore(this.searchOne.date[0], this.searchTwo.date[0])) {
          const second = differenceInSeconds(
            this.searchTwo.date[0],
            this.searchOne.date[0]
          )
          chartTwoData.forEach(element => {
            element.data.forEach(element => {
              element.time = second + Number(element.time)
            })
          })
        }
        this.chartData = this.chartData.concat(chartOneData)
      }

      if (isOneData && isTwoData) {
        if (isBefore(this.searchOne.date[0], this.searchTwo.date[0])) {
          this.xAxisData.min = this.searchOne.date[0]
        } else {
          this.xAxisData.min = this.searchTwo.date[0]
        }
        if (isBefore(this.searchOne.date[1], this.searchTwo.date[1])) {
          this.xAxisData.max = addDays(this.searchTwo.date[1], 1)
        } else {
          this.xAxisData.max = addDays(this.searchOne.date[1], 1)
        }
      } else if (isOneData) {
        this.xAxisData.min = this.searchOne.date[0]
        this.xAxisData.max = addDays(this.searchOne.date[1], 1)
      } else if (isTwoData) {
        this.xAxisData.min = this.searchTwo.date[0]
        this.xAxisData.max = addDays(this.searchTwo.date[1], 1)
      }
    }
  }
}
</script>

<style scoped>
div >>> .el-collapse-item__header,
div >>> .el-collapse-item__content {
  padding: 20px;
}

.el-collapse {
  border-left: 1px solid #ebeef5;
  border-right: 1px solid #ebeef5;
}

.el-date-editor,
.el-select {
  width: 100%;
}
</style>
