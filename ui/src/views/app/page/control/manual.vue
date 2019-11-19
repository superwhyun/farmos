<template>
  <div class="col-xxs-12 mx-auto my-auto" style="padding:15px">
    <h4 class="c-grey-900" v-if="getField && type === 'base'">{{getField.name}} 장비제어</h4>
    <h4 class="c-grey-900" v-if="type === 'nutrient-supply'">양액기 제어</h4>

    <template v-if="type === 'base'">
      <div>
        <b-row class="mt-4 mb-2">
          <b-col xxs="12">
            <div>
              <div class="float-left">
                <div class="d-inline-block">
                  <h5 class>개폐기</h5>
                </div>
              </div>
            </div>
          </b-col>
        </b-row>

        <b-row v-for="device in getRetractable" :key="device.id" class="mb-4">
          <b-col md="12">
            <b-card>
              <b-row>
                <b-col md="4">
                  <div v-if="controlData[device.id]">
                    <h3>{{device.name}}</h3>
                    <p>타입 : {{device.spec.Type}}</p>
                    <h5>
                      <DeviceState
                        :value="getObsData(getObservations['1'+device.id.toString().padStart(5,0)+'00'])"
                        :sub="getObservations['1'+device.id.toString().padStart(5,0)+'04'] ?
                getObservations['1'+device.id.toString().padStart(5,0)+'04'].nvalue : 0"
                        text="초 남음"
                      />
                    </h5>
                    <div style="text-align:center" class="mb-3">
                      <el-popover
                        trigger="hover"
                        placement="top-start"
                        v-if="device.spec.Type.split('/')[1] === 'level2'"
                      >
                        <template>
                          <el-divider content-position="left">열기 시간</el-divider>
                          <div v-if="controlData[device.id]">
                            <el-input-number
                              v-model="controlData[device.id].level2.opentime"
                              :min="10"
                            ></el-input-number>
                          </div>
                          <el-divider content-position="left">닫기 시간</el-divider>
                          <div>
                            <el-input-number
                              v-model="controlData[device.id].level2.closetime"
                              :min="10"
                            ></el-input-number>
                          </div>
                          <div class="mt-3">
                            <el-button
                              style="width:40%;float: right;"
                              @click="controlClick(device,'retractable',cmdCode.retractable.config,'level2')"
                            >설정</el-button>
                          </div>
                        </template>
                        <el-button slot="reference" style="width:100%" plain>개폐 초기값 설정</el-button>
                      </el-popover>
                    </div>
                    <el-divider content-position="left">기본 제어</el-divider>
                    <div style="text-align:center">
                      <el-button
                        style="width:42%"
                        type="info"
                        slot="reference"
                        plain
                        @click="controlClick(device,'retractable',cmdCode.retractable.stop)"
                      >중지</el-button>
                      <el-button
                        class="ml-4"
                        style="width:22%"
                        type="primary"
                        plain
                        @click="controlClick(device,'retractable',cmdCode.retractable.open)"
                      >열기</el-button>
                      <el-button
                        style="width:22%"
                        type="danger"
                        plain
                        @click="controlClick(device,'retractable',cmdCode.retractable.close)"
                      >닫기</el-button>
                    </div>
                    <div class="mt-3" style="text-align:center">
                      <template v-if="device.spec.Type.split('/')[1] !== 'level0'">
                        <el-divider content-position="left">시간 지정</el-divider>
                        <b-row>
                          <b-col md="6">
                            <el-input-number
                              style="width:100%"
                              :min="10"
                              v-model="controlData[device.id].level1.opentime"
                            ></el-input-number>
                            <el-button
                              class="mt-2"
                              style="width:100%"
                              type="primary"
                              plain
                              @click="controlClick(device,'retractable',cmdCode.retractable.timedopen,'level1')"
                            >열기</el-button>
                          </b-col>
                          <b-col md="6">
                            <el-input-number
                              style="width:100%"
                              :min="10"
                              v-model="controlData[device.id].level1.closetime"
                            ></el-input-number>
                            <el-button
                              class="mt-2"
                              style="width:100%"
                              type="danger"
                              plain
                              @click="controlClick(device,'retractable',cmdCode.retractable.timedclose,'level1')"
                            >닫기</el-button>
                          </b-col>
                        </b-row>
                      </template>

                      <template v-if="device.spec.Type.split('/')[1] === 'level2'">
                        <el-divider content-position="left">개방도 지정</el-divider>
                        <div class="ml-4 mr-1">
                          <el-slider
                            :min="0"
                            :max="100"
                            v-model="controlData[device.id].level2.position"
                          ></el-slider>
                          <el-button
                            style="width:48%;float: right;"
                            type="warning"
                            plain
                            @click="controlClick(device,'retractable',cmdCode.retractable.position,'level2')"
                          >시작</el-button>
                        </div>
                      </template>
                    </div>
                  </div>
                </b-col>
                <b-col md="8">
                  <div class="mb-2">
                    <el-button @click="historyDateChg(device.id,'prev')">전일</el-button>
                    <el-button @click="historyDateChg(device.id,'next')">다음일</el-button>
                    <el-switch
                      style="float:right"
                      v-model="device.roll"
                      active-text="사용"
                      inactive-text="롤링 중지"
                    ></el-switch>
                  </div>
                  <TimeLine
                    ref="timeline"
                    type="switch"
                    :roll="device.roll"
                    :history="history[device.id]"
                    :currentState="getObservations[device.id * 100 + 10000000]"
                  />
                </b-col>
              </b-row>
            </b-card>
          </b-col>
        </b-row>
      </div>

      <div>
        <b-row class="mb-2">
          <b-col xxs="12">
            <div>
              <div class="float-left">
                <div class="d-inline-block">
                  <h5 class>스위치</h5>
                </div>
              </div>
            </div>
          </b-col>
        </b-row>
        <b-row v-for="device in getSwitch" :key="device.id" class="mb-4">
          <b-col md="12">
            <b-card>
              <b-row>
                <b-col md="4">
                  <div v-if="controlData[device.id]">
                    <h3>{{device.name}}</h3>
                    <p>타입 : {{device.spec.Type}}</p>
                    <h5>
                      <DeviceState
                        :value="getObsData(getObservations['1'+device.id.toString().padStart(5,0)+'00'])"
                        :sub="getObservations['1'+device.id.toString().padStart(5,0)+'04'] ?
                getObservations['1'+device.id.toString().padStart(5,0)+'04'].nvalue : 0"
                        text="초 남음"
                      />
                    </h5>

                    <el-divider content-position="left">기본 제어</el-divider>
                    <div style="text-align:center">
                      <el-button
                        style="width:45%;"
                        type="primary"
                        plain
                        @click="controlClick(device,'switch',cmdCode.switch.on)"
                      >시작</el-button>
                      <el-button
                        slot="reference"
                        style="width:45%;float:right;"
                        type="info"
                        plain
                        @click="controlClick(device,'switch',cmdCode.switch.off)"
                      >중지</el-button>
                    </div>
                    <div class="mt-3" style="text-align:center">
                      <template v-if="device.spec.Type.split('/')[1]!=='level0'">
                        <el-divider content-position="left">시간 지정</el-divider>
                        <div>
                          <el-input-number
                            :min="10"
                            style="width:45%;"
                            v-model="controlData[device.id].level1.holdtime"
                          ></el-input-number>
                          <el-button
                            class="ml-2"
                            style="width:45%;float:right;"
                            type="primary"
                            plain
                            @click="controlClick(device,'switch',cmdCode.switch.timedon,'level1')"
                          >시작</el-button>
                        </div>
                      </template>
                      <template v-if="device.spec.Type.split('/')[1]==='level2'">
                        <el-divider content-position="left">비율 시간 지정</el-divider>
                        <div class="ml-4 mr-1">
                          <el-slider
                            :min="0"
                            :max="100"
                            v-model="controlData[device.id].level2.ratio"
                          ></el-slider>
                        </div>
                        <div>
                          <el-input-number
                            style="width:45%"
                            v-model="controlData[device.id].level1.holdtime"
                          ></el-input-number>
                          <el-button
                            style="width:45%;float:right;"
                            type="primary"
                            plain
                            @click="controlClick(device,'switch',cmdCode.switch.directionalon,'level2')"
                          >시작</el-button>
                        </div>
                      </template>
                    </div>
                  </div>
                </b-col>
                <b-col md="8">
                  <div class="mb-2">
                    <el-button @click="historyDateChg(device.id,'prev')">전일</el-button>
                    <el-button @click="historyDateChg(device.id,'next')">다음일</el-button>
                    <el-switch
                      style="float:right"
                      v-model="device.roll"
                      active-text="사용"
                      inactive-text="롤링 중지"
                    ></el-switch>
                  </div>
                  <TimeLine
                    ref="timeline"
                    type="switch"
                    :roll="device.roll"
                    :history="history[device.id]"
                    :currentState="getObservations[device.id * 100 + 10000000]"
                  />
                </b-col>
              </b-row>
            </b-card>
          </b-col>
        </b-row>
      </div>
    </template>

    <template v-else>
      <div>
        <b-row class="mb-2">
          <b-col xxs="12">
            <div>
              <div class="float-left">
                <div class="d-inline-block">
                  <h5 class>양액기</h5>
                </div>
              </div>
            </div>
          </b-col>
        </b-row>
        <b-row v-for="device in getNutrientSupply" :key="device.id">
          <b-col md="12">
            <b-card>
              <b-row>
                <b-col md="4">
                  <div v-if="controlData[device.id]">
                    <h3>{{device.name}}</h3>
                    <div class="mb-2">타입 : {{device.spec.Type}}</div>
                    <div
                      class="mb-2"
                    >제어권 : {{getObservations['1'+device.id.toString().padStart(5,0)+'06'].nvalue === 1 ? '로컬' : '플랫폼'}}</div>
                    <div>진행 구역</div>
                    <div class="mt-1 mb-3">
                      <el-tag
                        :key="place"
                        v-for="(place,index) in device.place"
                        size="small"
                        class="mr-1"
                        :type="getObservations['1'+device.id.toString().padStart(5,0)+'07'].nvalue === index+1 ? 'primary' : 'info'"
                        :effect="getObservations['1'+device.id.toString().padStart(5,0)+'07'].nvalue === index+1 ? 'dark' : 'plain'"
                      >{{getFieldName(index,place)}}</el-tag>
                    </div>
                    <h5>
                      <DeviceState
                        :value="getObsData(getObservations['1'+device.id.toString().padStart(5,0)+'00'])"
                      />
                    </h5>
                    <el-divider content-position="left">기본 제어</el-divider>
                    <div style="display: flex;align-items: center;">
                      제어권 변경
                      <el-button-group class="ml-auto">
                        <el-button type size="mini" @click="controlChange(device,1)">로컬</el-button>
                        <el-button type size="mini" @click="controlChange(device,2)">플랫폼</el-button>
                      </el-button-group>
                    </div>
                    <div class="mt-3" style="text-align:center">
                      <el-button
                        style="width:48%;"
                        type="primary"
                        plain
                        @click="controlClick(device,'nutrient-supply',cmdCode.nutrient.on)"
                      >시작</el-button>
                      <el-button
                        slot="reference"
                        style="width:48%"
                        type="info"
                        plain
                        @click="controlClick(device,'nutrient-supply',cmdCode.nutrient.off)"
                      >중지</el-button>

                      <template v-if="device.spec.Type.split('/')[1] !== 'level0'">
                        <el-divider content-position="left">파라미터 제어</el-divider>

                        <div class="mt-3">
                          <div class="ta-l">시작 - 종료 구역 설정</div>
                          <b-row class="mt-1">
                            <b-col md="6" class="p-0">
                              <el-select
                                placeholder="시작구역"
                                style="width:100%"
                                v-model="controlData[device.id].level1.startarea"
                              >
                                <template v-for="(place,placeIndex) in device.place">
                                  <template v-for="field in getFields">
                                    <el-option
                                      v-if="place === field.id"
                                      :key="place+field"
                                      :label="(placeIndex+1) +' - ' +field.name"
                                      :value="field.id"
                                    ></el-option>
                                  </template>
                                </template>
                              </el-select>
                            </b-col>
                            <b-col md="6" class="p-0">
                              <el-select
                                placeholder="종료구역"
                                :style="{width:'97%' ,float:'right'}"
                                v-model="controlData[device.id].level1.stoparea"
                              >
                                <template v-for="(place,placeIndex) in device.place">
                                  <template v-for="field in getFields">
                                    <el-option
                                      v-if="place === field.id"
                                      :key="place+field"
                                      :label="(placeIndex+1) +' - ' +field.name"
                                      :value="field.id"
                                    ></el-option>
                                  </template>
                                </template>
                              </el-select>
                            </b-col>
                          </b-row>
                        </div>

                        <div class="mt-3">
                          <div class="ta-l mb-1">환경 설정</div>
                          <el-input style="width:50%;" v-model="controlData[device.id].level1.ec">
                            <template slot="prepend">EC&nbsp;</template>
                          </el-input>
                          <el-input
                            style="width:48%;"
                            class="ml-2"
                            v-model="controlData[device.id].level1.ph"
                          >
                            <template slot="prepend">pH&nbsp;</template>
                          </el-input>
                        </div>
                        <div class="mt-2">
                          <el-input
                            :style="{width:'50%' ,float:'left'}"
                            v-model="controlData[device.id].level1.sec"
                          >
                            <template slot="prepend" style="width:40px;">시간</template>
                          </el-input>
                          <el-button
                            :style="{width:'48%' ,float:'right'}"
                            type="primary"
                            plain
                            @click="controlClick(device,'nutrient-supply',cmdCode.nutrient.param,'level1')"
                          >시작</el-button>
                        </div>
                      </template>
                    </div>
                  </div>
                </b-col>
                <b-col md="8">
                  <div class="mb-2">
                    <el-button @click="historyDateChg(device.id,'prev')">전일</el-button>
                    <el-button @click="historyDateChg(device.id,'next')">다음일</el-button>
                    <el-switch
                      style="float:right"
                      v-model="device.roll"
                      active-text="사용"
                      inactive-text="롤링 중지"
                    ></el-switch>
                  </div>
                  <TimeLine
                    ref="timeline"
                    type="switch"
                    :history="history[device.id]"
                    :currentState="getObservations[device.id * 100 + 10000000]"
                  />
                </b-col>
              </b-row>
            </b-card>
          </b-col>
        </b-row>
      </div>
    </template>
  </div>
</template>

<script>
import TimeLine from '@/components/TimeLine'
import DeviceState from '@/components/DeviceState'
import { statusCode, cmdCode } from '@/constants/config'
import { mapGetters } from 'vuex'
export default {
  props: {
    id: String,
    type: String
  },
  components: {
    DeviceState,
    TimeLine
  },
  data () {
    return {
      statusCode: statusCode,
      cmdCode: cmdCode,
      controlData: {},
      history: {}
    }
  },
  watch: {
    getNotiLast (noti) {
      let isDevice = false
      for (const key in noti) {
        if (key !== 'code' || key !== 'time') {
          for (const sw of this.getSwitch) {
            if (sw.id === Number(key)) {
              isDevice = true
              break
            }
          }
          for (const ret of this.getRetractable) {
            if (ret.id === Number(key)) {
              isDevice = true
              break
            }
          }
          for (const ret of this.getNutrientSupply) {
            if (ret.id === Number(key)) {
              isDevice = true
              break
            }
          }
        }
      }
      if (isDevice) {
        this.getAllDeviceHistory()
      }
    }
  },
  computed: {
    ...mapGetters({
      getNotiLast: 'mqtt/getNotiMsgLast',
      getFields: 'field/getFields',
      getDevices: 'device/getDevices',
      getAllFieldDevices: 'device/getAllFieldDevices',
      getObservations: 'observation/getObservations'
    }),
    getCurrentDevice () {
      let item = []
      if (this.getAllFieldDevices && this.getAllFieldDevices[this.id]) {
        item = this.getAllFieldDevices[this.id]
      }

      for (const device of item) {
        this.$set(device, 'roll', true)
      }

      if (item.length > 0) {
        this.historyDataMaker(item)
        this.controlDataMaker(item)
        this.getAllDeviceHistory()
      }
      return item
    },

    getNutrientSupply () {
      let item = []
      if (this.getDevices) {
        item = this.getDevices.filter(device => {
          return device.spec.Class === 'nutrient-supply'
        })

        for (const device of item) {
          this.$set(device, 'roll', true)
        }
      }

      if (item.length > 0) {
        this.historyDataMaker(item)
        this.controlDataMaker(item)
        this.getAllDeviceHistory()
      }
      return item
    },
    getRetractable () {
      if (this.getCurrentDevice) {
        return this.getCurrentDevice.filter(device => {
          return (
            device.spec.Class === 'actuator' &&
            device.spec.Type.startsWith('retractable')
          )
        })
      }
      return []
    },
    getSwitch () {
      if (this.getCurrentDevice) {
        return this.getCurrentDevice.filter(device => {
          return (
            device.spec.Class === 'actuator' &&
            device.spec.Type.startsWith('switch')
          )
        })
      }
      return []
    },
    getField () {
      return this.getFields.filter(field => field.id === Number(this.id))[0]
    }
  },
  mounted () {
    // this.getAllDeviceHistory()
  },
  methods: {
    getFieldName (index, id) {
      for (const field of this.getFields) {
        if (field.id === id) {
          return `${index + 1} - ${field.name}`
        }
      }
    },
    historyDataMaker (devices) {
      for (const device of devices) {
        if (!this.history.hasOwnProperty(device.id)) {
          this.$set(this.history, device.id, {
            requests: [],
            states: [],
            date: this.$date().format(new Date(), 'YYYY-MM-DD')
          })
        }
      }
    },
    historyDateChg (deviceId, type) {
      let date = new Date(this.history[deviceId].date)
      if (type === 'prev') {
        this.history[deviceId].date = this.$date().format(
          date.setDate(date.getDate() - 1),
          'YYYY-MM-DD'
        )
      } else {
        this.history[deviceId].date = this.$date().format(
          date.setDate(date.getDate() + 1),
          'YYYY-MM-DD'
        )
      }
      this.getDeviceHistory(deviceId, this.history[deviceId].date)
    },
    async getAllDeviceHistory () {
      for (const key in this.history) {
        await this.getDeviceHistory(key, this.history[key].date)
      }
    },
    async getDeviceHistory (deivceId, date) {
      const { data } = await this.axios.get(`device/history/${deivceId}`, {
        params: {
          date: this.$date().format(date, 'YYYY-MM-DD')
        }
      })

      this.$set(this.history[deivceId], 'requests', data.requests)
      this.$set(this.history[deivceId], 'states', data.states)
    },
    getObsData (data) {
      if (data) {
        if (data.unit === '상태') {
          return this.statusCode[data.nvalue]
        } else {
          return `${data.nvalue} ${data.unit}`
        }
      } else {
        return '---'
      }
    },
    controlDataMaker (devices) {
      devices.forEach(device => {
        if (!this.controlData[device.id]) {
          let data = {
            level0: {},
            level1: {},
            level2: {}
          }
          if (
            device.spec.Class === 'actuator' &&
            device.spec.Type.startsWith('retractable')
          ) {
            if (device.spec.Type.split('/')[1] !== 'level0') {
              data.level1.opentime = 0
              data.level1.closetime = 0
            }
            if (device.spec.Type.split('/')[1] === 'level2') {
              data.level2.position = 0
              data.level2.opentime = 0
              data.level2.closetime = 0
            }
          } else if (
            device.spec.Class === 'actuator' &&
            device.spec.Type.startsWith('switch')
          ) {
            if (device.spec.Type.split('/')[1] !== 'level0') {
              data.level1.holdtime = 0
            }
            if (device.spec.Type.split('/')[1] === 'level2') {
              data.level2.holdtime = 0
              data.level2.ratio = 0
            }
          } else if (device.spec.Class === 'nutrient-supply') {
            data.level0.control = 1
            if (device.spec.Type.split('/')[1] === 'level1') {
              data.level1.ec = 0
              data.level1.ph = 0
              data.level1.sec = 0
              data.level1.startarea = ''
              data.level1.stoparea = ''
            }
          }
          this.$set(this.controlData, device.id, data)
        }
      })
    },
    controlChange (device, value) {
      let result = this.mqtt.deivceControl(
        device,
        this.cmdCode.nutrient.control,
        { control: value }
      )

      if (!result) {
        this.$notify({
          title: '실패',
          message: '제어 명령은 5초에 한번씩 전송 가능 합니다',
          type: 'error'
        })
      }
    },
    controlClick (device, type, control, level) {
      if (type === 'nutrient-supply' && level !== undefined) {
        if (
          device.place.indexOf(this.controlData[device.id][level].startarea) ===
            -1 ||
          device.place.indexOf(this.controlData[device.id][level].stoparea) ===
            -1
        ) {
          this.$notify({
            title: '실패',
            message: '관수 구역을 설정해 주세요',
            type: 'error'
          })
          return
        }
        if (
          Number(
            device.place.indexOf(this.controlData[device.id][level].startarea)
          ) +
            1 >
          Number(
            device.place.indexOf(this.controlData[device.id][level].stoparea)
          ) +
            1
        ) {
          this.$notify({
            title: '실패',
            message: '관수 시작 구역을 낮은 번호로 입력 하세요',
            type: 'error'
          })
          return
        }
      }

      let result = this.mqtt.deivceControl(
        device,
        control,
        this.controlData[device.id][level]
      )
      if (!result) {
        this.$notify({
          title: '실패',
          message: '제어 명령은 5초에 한번씩 전송 가능 합니다',
          type: 'error'
        })
      }
    }
  }
}
</script>

<style lang="scss">
</style>
