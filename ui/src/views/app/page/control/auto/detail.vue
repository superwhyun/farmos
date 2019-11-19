<template>
  <div class="col-xxs-12 mx-auto my-auto">
    <el-card
      class="header"
      shadow="never"
      style="border-radius:0px;z-index: 10;border-left-width: 0px;"
    >
      <div class="clearfix">
        <div style="display: flex;align-items: center;">
          {{rule.name}}
          <div class="ml-auto" style="display: flex;align-items: center;">
            <div>
              <el-switch
                :disabled="this.isSetLoading"
                v-model="rule.used"
                active-text="사용"
                inactive-text="자동 중지"
                :active-value="1"
                :inactive-value="0"
                @change="useChange"
              ></el-switch>
            </div>
            <div class="ml-3">
              <div>
                <el-checkbox
                  style="margin-bottom: 0px;"
                  v-model="configTimeViewer"
                  v-if="useTimespan"
                >공통설정 보기</el-checkbox>
              </div>
              <el-checkbox style="margin-bottom: 0px;" v-model="configAdViewer">고급설정 보기</el-checkbox>
            </div>
            <el-button class="ml-4" @click="ruleDelete">작동규칙 삭제</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <div style="display: flex;padding-right: 15px;padding-left: 15px;">
      <div
        style="margin-top: 100px;"
        ref="scroll"
        v-if="rule.constraints"
        class="main"
        v-scroll-spy="{data: 'section',offset: 146}"
      >
        <div v-if="useTimespan">
          <el-card
            v-loading="isSetLoading"
            element-loading-text="환경 설정을 완료해 주세요"
            class="box-card mb-5"
            shadow="al"
            style="cursor: pointer;"
          >
            <div slot="header" class="clearfix">
              <div style="display: flex;align-items: center;">
                공통 설정
                <el-button class="ml-auto" @click="saveTimeSpan">저장</el-button>
              </div>
            </div>

            <lineChart
              class="mb-4"
              :id="'line'"
              :latlng="getLatLng"
              :sections="getChartData.sections"
              :thresholds="getChartData.thresholds"
              :useds="getChartData.useds"
              :xAxisData="xAxisData"
            ></lineChart>
            <div style="overflow-x:auto">
              <table class="table text-nowrap" v-if="timeSpan.timespan && timeSpan.timespan">
                <thead>
                  <tr style="background-color: #f8f8f8;">
                    <th style="text-align:center;border-bottom: 1px solid #bbb;">시간대 사용유무</th>
                    <th
                      v-for="(part,idx) in timeSpan.timespan.parts"
                      style="text-align:center;border-bottom: 1px solid #bbb;"
                      :key="idx"
                    >
                      <el-checkbox
                        border
                        size="small"
                        v-model="rule.configurations.timespan.used[idx]"
                        :label="part.name"
                        style="margin-bottom: 0px"
                      ></el-checkbox>
                    </th>
                  </tr>
                </thead>
                <tbody v-if="configTimeViewer">
                  <tr>
                    <td>시간</td>
                    <td :key="index" v-for="(part,index) in timeSpan.timespan.parts">
                      <el-input
                        placeholder="초"
                        :max="86400"
                        :min="0"
                        v-model="part.value"
                        :disabled="part.type === 'rise' || part.type === 'set'"
                        type="number"
                        class="input-with-select"
                      >
                        <el-select
                          v-model="part.type"
                          slot="prepend"
                          placeholder="선택"
                          style="width: 70px;"
                        >
                          <el-option value label="초"></el-option>
                          <el-option value="rise-" label="일출전"></el-option>
                          <el-option value="rise" label="일출"></el-option>
                          <el-option value="rise+" label="일출후"></el-option>
                          <el-option value="set-" label="일몰전"></el-option>
                          <el-option value="set" label="일몰"></el-option>
                          <el-option value="set+" label="일몰후"></el-option>
                        </el-select>
                      </el-input>
                    </td>
                  </tr>
                  <tr :key="index" v-for="(threshold,index) in timeSpan.timespan.threshold">
                    <td>{{threshold.name}}</td>
                    <td :key="index" v-for="(timeoption,index) in threshold.timeoption">
                      <el-input-number v-model="timeoption.to" class="w-100"></el-input-number>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </el-card>
        </div>

        <div>
          <el-card
            v-loading="isSetLoading"
            element-loading-text="환경 설정을 완료해 주세요"
            class="box-card mb-5"
            shadow="al"
            style="cursor: pointer;"
          >
            <div slot="header" class="clearfix">
              <div style="display: flex;align-items: center;">
                동작 설정
                <el-button class="ml-auto" @click="saveConfiguration">저장</el-button>
              </div>
            </div>
            <transition name="slide-fade">
              <div>
                <div :style="{opacity : configAdViewer ? 1 : 0.3}">
                  <el-divider content-position="left">고급 설정</el-divider>
                </div>
                <div v-if="configAdViewer">
                  <div>Use TimeSpan ID : {{rule.configurations.timespan}}</div>
                  <div class="mb-4">TimeSpan 변경은 관리자의 수동 변경만 가능 합니다</div>
                  <el-row :gutter="20">
                    <el-col
                      class="mb-4"
                      :span="8"
                      v-for="(item,index) in rule.configurations.advanced"
                      :key="index"
                    >
                      <el-card style shadow="hover">
                        <div slot="header" class="clearfix">
                          <div>{{item.name}}</div>
                          <div>{{item.key}}</div>
                        </div>

                        <el-input-number
                          v-if="item.minmax"
                          class="w-100"
                          v-model="item.value"
                          :min="item.minmax[0]"
                          :max="item.minmax[1]"
                        ></el-input-number>
                        <el-input-number v-else class="w-100" v-model="item.value"></el-input-number>
                        <div class="mt-2" style="white-space: nowrap;">{{item.description}}</div>
                      </el-card>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </transition>
            <div class="mb-5"></div>
            <el-divider content-position="left">일반 설정</el-divider>
            <div style="overflow-x:auto">
              <table class="table text-nowrap" v-if="rule.configurations">
                <thead>
                  <tr style="background-color: #f8f8f8;">
                    <th style="text-align:center;border-bottom: 1px solid #bbb;">이름</th>
                    <template v-if="timeSpan.timespan && timeSpan.timespan">
                      <th
                        v-for="(part,idx) in timeSpan.timespan.parts"
                        style="text-align:center;border-bottom: 1px solid #bbb;"
                        :key="idx"
                      >{{part.name}}</th>
                    </template>
                    <template v-else>
                      <th style="text-align:center;border-bottom: 1px solid #bbb;">전체 시간</th>
                    </template>
                  </tr>
                </thead>
                <tbody v-if="isBasicUsedComplate">
                  <tr v-for="(item,index) in rule.configurations.basic" :key="index">
                    <td>
                      <el-checkbox v-model="item.use">설정 사용</el-checkbox>
                      <br />
                      {{item.name}}
                    </td>
                    <template v-if="item.type">
                      <template v-if="item.type === 'ts_float'">
                        <td v-for="(value,index) in item.value" :key="index">
                          <el-input-number
                            v-model="item.value[index]"
                            class="w-100"
                            :disabled="!item.use || !rule.configurations.timespan.used[index]">
                          </el-input-number>
                        </td>
                      </template>
                      <template v-if="item.type === 'ts_time'">
                        <td v-for="(value,index) in item.value" :key="index">
                          <el-time-picker
                            class="w-100"
                            value-format="HH:mm:ss"
                            v-model="item.value[index]"
                            :disabled="!item.use || !rule.configurations.timespan.used[index]">
                          </el-time-picker>
                        </td>
                      </template>
                      <td v-else colspan="100%">
                        <el-time-picker
                          class="w-100"
                          value-format="HH:mm:ss"
                          v-model="item.value"
                          :disabled="!item.use"
                        ></el-time-picker>
                      </td>
                    </template>
                    <template v-else>
                      <td colspan="100%">
                        <el-input-number
                          v-model="item.value"
                          class="w-100"
                          :disabled="!item.use"
                        ></el-input-number>
                      </td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
          </el-card>
        </div>
        <div>
          <el-card class="box-card mb-5" shadow="al" style="cursor: pointer;">
            <div slot="header" class="clearfix">
              <div style="display: flex;align-items: center;">
                출력 설정
                <el-button class="ml-auto" @click="saveDataIndex">저장</el-button>
              </div>
            </div>

            <el-row :gutter="20">
              <template v-for="(data,index) in rule.outputs.data">
                <el-col
                  class="mb-4"
                  :span="8"
                  :key="index"
                  v-if="data.name && outputDataIndex[30000000 + (rule.id * 10000) + data.outcode]"
                >
                  <el-card style shadow="hover">
                    <div slot="header" class="clearfix">{{data.outputs}} : {{data.name}}</div>
                    <font class="text-muted ml-1">이름 변경</font>
                    <el-input
                      class="mt-1"
                      placeholder="데이터 이름"
                      v-model="outputDataIndex[30000000 + (rule.id * 10000) + data.outcode].name"
                    ></el-input>
                  </el-card>
                </el-col>
              </template>
            </el-row>
          </el-card>
        </div>
        <div>
          <el-card class="box-card mb-5" shadow="al" style="cursor: pointer;">
            <div slot="header" class="clearfix">
              <div style="display: flex;align-items: center;">
                환경 설정
                <el-button class="ml-auto" @click="saveConstraint">저장</el-button>
              </div>
            </div>

            <el-row :gutter="20">
              <el-col
                class="mb-4"
                :sm="16"
                :lg="8"
                v-for="(device,index) in rule.constraints.devices"
                :key="`device${index}`"
              >
                <el-card style shadow="hover">
                  <div slot="header" class="clearfix">{{device.desc}}</div>
                  장비 {{!device.optional || device.optional === 'false' ? ' 필수 선택' : '옵션 선택' }}
                  <el-select v-model="device.deviceid" placeholder="미설정" class="w-100 mt-2">
                    <template v-for="item in getFieldDevice">
                      <el-option
                        v-if="item.spec.Type === device.type"
                        :key="`${index}_${item.id}`"
                        :label="item.name ? item.name : item.spec.Name ? item.spec.Name : item.spec.Type "
                        :value="item.id"
                      ></el-option>
                    </template>
                  </el-select>
                </el-card>
              </el-col>
              <el-col
                class="mb-4"
                :span="8"
                v-for="(device,index) in rule.constraints.data"
                :key="`data${index}`"
              >
                <el-card style shadow="hover">
                  <div slot="header" class="clearfix">{{device.desc}}</div>
                  데이터 {{!device.optional || device.optional === 'false' ? ' 필수 선택' : '옵션 선택' }}
                  <el-select v-model="device.dataid" placeholder="미설정" class="w-100 mt-2">
                    <template v-for="item in dataindexList">
                      <el-option
                        v-if="checkIdfmt(device.idfmt,item)"
                        :key="`${index}_${item.id}`"
                        :label="item.name"
                        :value="item.id"
                      ></el-option>
                    </template>
                  </el-select>
                </el-card>
              </el-col>
            </el-row>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import LineChart from '@/components/LineChart'
import { mapGetters } from 'vuex'
export default {
  props: ['fieldId', 'ruleId'],
  components: {
    LineChart
  },
  data () {
    var today = new Date()
    return {
      isBasicUsedComplate: false,
      isSetLoading: true,
      configTimeViewer: false,
      configAdViewer: false,
      section: 0,
      rule: {},
      outputDataIndex: {},
      dataindexList: [],
      timeSpan: {},
      xAxisData: {
        min: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          0,
          0,
          0
        ),
        max: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          24,
          0,
          0
        )
      }
    }
  },
  computed: {
    ...mapGetters({
      getAllFieldDevices: 'device/getAllFieldDevices',
      getObservations: 'observation/getObservations'
    }),
    useTimespan () {
      if (this.rule.configurations) {
        return this.rule.configurations.timespan.id > 0
      }
      return true
    },
    getFieldDevice () {
      let devices = []
      if (Number(this.fieldId) !== 0 && this.getAllFieldDevices[0]) {
        devices = this.getAllFieldDevices[0].concat(
          this.getAllFieldDevices[this.fieldId]
        )
      } else {
        devices = this.getAllFieldDevices[this.fieldId]
      }
      return devices
    },
    getField () {
      return this.$store.getters['field/getField'](this.fieldId)
    },
    getLatLng () {
      if (this.getField) {
        return {
          lat: this.getField.data.lat.value,
          lng: this.getField.data.lng.value
        }
      }
      return {}
    },
    getChartData () {
      let chartData = {
        thresholds: [],
        sections: [],
        useds: []
      }

      if (!this.timeSpan.timespan) {
        return chartData
      }

      chartData.sections = this.timeSpan.timespan.parts
      chartData.thresholds = this.timeSpan.timespan.threshold
      this.timeSpan.timespan.parts.forEach(element => {
        chartData.useds.push(true)
      })
      return chartData
    }
  },
  methods: {
    async saveDataIndex () {
      try {
        await this.axios.put('dataindex', Object.values(this.outputDataIndex))
        this.$notify({
          title: '성공',
          message: '데이터 이름을 변경 하였습니다',
          type: 'success'
        })
      } catch (error) {
        this.$notify({
          title: '실패',
          message: '에러가 발생 하였습니다',
          type: 'error'
        })
      }
    },
    async ruleDelete () {
      this.$confirm('해당 룰을 삭제 하시겠습니까?', '확인', {
        type: 'warning'
      })
        .then(async _ => {
          try {
            await this.axios.delete(`rule/applied/${this.ruleId}`)
            this.$notify({
              title: '성공',
              message: '룰을 제거 하였습니다',
              type: 'success'
            })
            this.$router.push(`/control/auto/${this.fieldId}`)
          } catch (error) {
            this.$notify({
              title: '실패',
              message: '에러가 발생 하였습니다',
              type: 'error'
            })
          }
        })
        .catch(_ => {})
    },
    async useChange (val) {
      try {
        await this.axios.put(`rule/applied/${this.ruleId}`, {
          used: val
        })

        if (val === 1) {
          this.$notify({
            title: '성공',
            message: '작동규칙 사용함으로 변경 하였습니다',
            type: 'success'
          })
        } else {
          this.$notify({
            title: '성공',
            message: '작동규칙 중지로 변경 하였습니다',
            type: 'success'
          })
        }
      } catch (error) {
        this.$notify({
          title: '실패',
          message: '에러가 발생 하였습니다',
          type: 'error'
        })
        this.rule.used = !this.rule.used
      }
    },
    checkConstraint () {
      let isCheck = true

      if (this.rule.constraints.devices) {
        for (const device of this.rule.constraints.devices) {
          if (!device.optional || device.optional === 'false') {
            if (device.deviceid === '') {
              isCheck = false
              break
            }
          }
        }
      }

      if (this.rule.constraints.data) {
        for (const data of this.rule.constraints.data) {
          if (!data.optional || data.optional === 'false') {
            if (data.dataid === '') {
              isCheck = false
              break
            }
          }
        }
      }

      if (isCheck) {
        this.isSetLoading = false
        return true
      } else {
        this.isSetLoading = true
        return false
      }
    },
    async saveTimeSpan () {
      try {
        this.timeSpan.timespan.parts.forEach(element => {
          element.to = element.type + element.value
        })

        await this.axios.put(`rule/applied/${this.ruleId}`, {
          timespan: this.timeSpan,
          configurations: this.rule.configurations
        })

        this.$notify({
          title: '성공',
          message: '동작설정을 변경 하였습니다',
          type: 'success'
        })
      } catch (error) {
        console.log(error)
      }
    },
    async saveConfiguration () {
      try {
        const configurations = this._.cloneDeep(this.rule.configurations)

        configurations.basic.forEach(element => {
          if (element.use) {
            if (element.type) {
              if (element.type === 'time') {
                if (element.value !== null) {
                  const time = element.value.split(':')
                  const second = +time[0] * 60 * 60 + +time[1] * 60 + +time[2]
                  element.value = second
                }
              } else if (element.type === 'ts_time') {
                if (element.value !== null) {
                  element.value.forEach(element => {
                    const time = element.value.split(':')
                    const second = +time[0] * 60 * 60 + +time[1] * 60 + +time[2]
                    element.value = second
                  })
                }
              }
            }
          } else {
            element.value = null
          }
          delete element.use
        })

        await this.axios.put(`rule/applied/${this.ruleId}`, {
          configurations: configurations
        })
        this.$notify({
          title: '성공',
          message: '동작설정을 변경 하였습니다',
          type: 'success'
        })
      } catch (error) {
        console.log(error)
      }
    },
    async saveConstraint () {
      try {
        if (!this.checkConstraint()) {
          this.$notify({
            title: '실패',
            message: '환경설정 센서를 선택 해 주세요',
            type: 'error'
          })
          return
        }
        let inputList = []

        if (this.rule.constraints.devices) {
          for (const device of this.rule.constraints.devices) {
            for (const fieldDevice of this.getFieldDevice) {
              if (device.deviceid === fieldDevice.id) {
                console.log(fieldDevice)
                device.name = fieldDevice.name
                break
              }
            }

            if (device.hasOwnProperty('inputs')) {
              for (const code of device.inputs.codes) {
                inputList.push({
                  key: device.inputs.key + code,
                  dataid: 1 * 10000000 + device.deviceid * 100 + code
                })
              }
            }
          }

          if (this.rule.outputs.req) {
            let removeDevice = []
            let targets = []
            for (const device of this.rule.constraints.devices) {
              if (
                device.class !== 'sensor' &&
                (device.optional && device.optional === true)
              ) {
                if (device.deviceid.toString().length > 0) {
                  targets.push(device.outputs)
                }
                removeDevice.push(device.outputs)
              }
            }

            for (const req of this.rule.outputs.req) {
              this._.remove(req.targets, function (el) {
                return removeDevice.indexOf(el) !== -1
              })
              req.targets = req.targets.concat(targets)
            }
          }
        }

        if (this.rule.constraints.data) {
          for (const data of this.rule.constraints.data) {
            inputList.push({
              key: data.key,
              dataid: Number(data.dataid)
            })
          }
        }

        await this.axios.put(`rule/applied/${this.ruleId}`, {
          constraints: this.rule.constraints,
          inputs: inputList,
          outputs: this.rule.outputs
        })

        this.$notify({
          title: '성공',
          message: '환경설정을 완료 하였습니다',
          type: 'success'
        })
        this.checkConstraint()
      } catch (error) {
        console.log(error)
      }
    },
    async getRule () {
      try {
        const { data } = await this.axios.get(`/rule/applied/${this.ruleId}`)
        this.rule = data

        this.checkConstraint()
      } catch (error) {
        console.log(error)
      }
    },
    makeOutputDataIndex () {
      if (this.rule.outputs.data) {
        for (const data of this.rule.outputs.data) {
          const code = 30000000 + this.rule.id * 10000 + data.outcode
          for (const dataIndex of this.dataindexList) {
            if (dataIndex.id === code) {
              this.$set(this.outputDataIndex, code, dataIndex)
              break
            }
          }
        }
      }
    },
    checkIdfmt (idfmt, item) {
      var re = new RegExp(idfmt)
      let regResult = re.test(item.id)

      if (regResult) {
        if (
          item.id.toString().startsWith('0') ||
          item.id.toString().startsWith('2')
        ) {
          const id = item.id.substring(1, 3)
          if (Number(id) === Number(this.fieldId)) {
            regResult = true
          } else {
            regResult = false
          }
        }
      }

      return regResult
    },
    async getDataIndex () {
      try {
        const { data } = await this.axios.get('dataindex')
        this.dataindexList = data
      } catch (error) {
        console.log(error)
      }
    },
    async getTimeSpan () {
      try {
        const { data } = await this.axios.get(
          `/rule/timespan/${this.rule.configurations.timespan.id}/field/${this.fieldId}`
        )
        this.timeSpan = data
      } catch (error) {
        console.log(error)
      }
    },
    async setBasicUsed () {
      for (const item of this.rule.configurations.basic) {
        if (item.value === null) {
          this.$set(item, 'use', false)

          if (item.type) {
            if (item.type === 'time') {
              item.value = `0:0:0`
            } else if (item.type === 'ts_time') {
              item.value = []
              this.timeSpan.timespan.parts.forEach(element => {
                item.value.push(`0:0:0`)
              })
            } else if (item.type === 'ts_float') {
              item.value = []
              this.timeSpan.timespan.parts.forEach(element => {
                item.value.push(0)
              })
            }
          } else {
            item.value = 0
          }
        } else {
          this.$set(item, 'use', true)

          if (item.type) {
            if (item.type === 'time') {
              var hour = parseInt(item.value / 3600)
              var min = parseInt((item.value % 3600) / 60)
              var sec = item.value % 60
              item.value = `${hour}:${min}:${sec}`
            } else if (item.type === 'ts_time') {
              item.value.forEach(element => {
                var hour = parseInt(element / 3600)
                var min = parseInt((element % 3600) / 60)
                var sec = element % 60
                element = `${hour}:${min}:${sec}`
              })
            }
          }
        }
      }
      this.isBasicUsedComplate = true
    }
  },
  async mounted () {
    await this.getRule()
    await this.getTimeSpan()
    await this.setBasicUsed()
    await this.getDataIndex()
    this.makeOutputDataIndex()
    // this.chartDataMake()
  }
}
</script>

<style scoped>
.table th {
  vertical-align: middle;
  border-bottom: 2px solid rgba(0, 0, 0, 0.0625);
}

.table td {
  vertical-align: middle;
}

.table >>> .el-loading-mask {
  top: 60px;
}

div >>> .el-card__header {
  padding-top: 10px;
  padding-bottom: 10px;
  background-color: #f8f8f8;
}

div >>> .el-input-group__prepend {
  background-color: white;
}

div >>> .el-input__inner {
  /* padding-left: 8px; */
  /* padding-right: 0px; */
  /* text-align: center; */
}

div >>> .el-input__suffix {
  right: -2px;
}

.scollSideBar {
  /* top: 30px;
  left: 10px; */
  max-width: 180px;
  font-size: 18px;
}
.menu {
  padding: 0;
  list-style: none;
}
.current-section {
  padding-top: 50px;
}
.current-section input {
  max-width: 3em;
}
.menu-item {
  margin-bottom: 20px;
}
.menu-item a {
  cursor: pointer;
}
.main {
  /* margin-left: 180px; */
  width: 100%;
}
.customActive {
  color: #178ce6;
  border-left: 1px solid #178ce6;
  padding-left: 5px;
  transition: all 0.5s;
}
</style>
