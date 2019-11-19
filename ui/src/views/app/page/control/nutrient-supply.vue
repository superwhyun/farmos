<template>
  <div class="col-xxs-12 mx-auto my-auto">
    <h4 class="c-grey-900">양액기 제어</h4>

    <b-card-body>
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
                <b-card v-if="controlData[device.id]">
                  <h3>{{device.name}}</h3>
                  <p>타입 : {{device.spec.Type}}</p>
                  <!-- <p>관수구역 : {{getObsData(getObservations['1'+device.id.toString().padStart(5,0)+'07'])}}</p> -->
                  <p>제어권 : {{controlData[device.id].level0.control === 1 ? '로컬' : '플랫폼'}}</p>
                  <div>진행 구역</div>
                  <div class="mt-1 mb-4">
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
                  <el-divider content-position="left">제어</el-divider>
                  <div style="display: flex;align-items: center;">
                    제어권 변경
                    <el-button-group class="ml-auto">
                      <el-button type size="mini" @click="controlChange(device,1)">로컬</el-button>
                      <el-button type size="mini" @click="controlChange(device,2)">플랫폼</el-button>
                    </el-button-group>
                  </div>
                  <div class="mt-3" style="text-align:center">
                    <el-popover trigger="click" placement="top" width="250">
                      <el-divider content-position="left">1회 관수</el-divider>
                      <div>
                        <el-button
                          style="width:100%;"
                          type="primary"
                          plain
                          @click="controlClick(device,'nutrient-supply',cmdCode.nutrient.on)"
                        >시작</el-button>
                      </div>
                      <template v-if="device.spec.Type.split('/')[1] !== 'level0'">
                        <el-divider content-position="left">제어 동작</el-divider>
                        <div>
                          <el-input style="width:100%;" v-model="controlData[device.id].level1.ec">
                            <template slot="prepend">EC&nbsp;</template>
                          </el-input>
                        </div>
                        <div class="mt-2">
                          <el-input style="width:100%;" v-model="controlData[device.id].level1.ph">
                            <template slot="prepend">pH&nbsp;</template>
                          </el-input>
                        </div>
                        <div class="mt-2">
                          <el-input style="width:100%;" v-model="controlData[device.id].level1.sec">
                            <template slot="prepend" style="width:40px;">시간</template>
                          </el-input>
                        </div>
                        <div class="mt-2">
                          <el-select
                            placeholder="시작구역"
                            style="width:105px"
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
                          <el-select
                            placeholder="종료구역"
                            style="width:105px;float: right;"
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
                        </div>
                        <el-button
                          class="mt-3"
                          style="width:40%;float: right;"
                          type="primary"
                          plain
                          @click="controlClick(device,'nutrient-supply',cmdCode.nutrient.param,'level1')"
                        >시작</el-button>
                      </template>
                      <el-button
                        slot="reference"
                        :style="{width:'48%' ,float:'left'}"
                        type="primary"
                        plain
                      >동작</el-button>
                    </el-popover>
                    <el-button
                      slot="reference"
                      :style="{width:'48%' ,float:'right'}"
                      type="info"
                      plain
                      @click="controlClick(device,'nutrient-supply',cmdCode.nutrient.off)"
                    >중지</el-button>
                  </div>
                </b-card>
              </b-col>
              <b-col md="8">
                <TimeLine />
              </b-col>
            </b-row>
          </b-card>
        </b-col>
      </b-row>
    </b-card-body>
  </div>
</template>

<script>
import TimeLine from '@/components/TimeLine'
import DeviceState from '@/components/DeviceState'
import { statusCode, cmdCode } from '@/constants/config'
import { mapGetters } from 'vuex'
export default {
  props: {
    id: String
  },
  components: {
    DeviceState,
    TimeLine
  },
  data () {
    return {
      statusCode: statusCode,
      cmdCode: cmdCode,
      controlData: {}
    }
  },
  watch: {
    getNutrientSupply (newValue, oldValue) {
      this.controlDataMaker(newValue)
    }
  },
  computed: {
    ...mapGetters({
      getFields: 'field/getFields',
      getDevices: 'device/getDevices',
      getObservations: 'observation/getObservations'
    }),
    getNutrientSupply () {
      if (this.getDevices) {
        return this.getDevices.filter(device => {
          return device.spec.Class === 'nutrient-supply'
        })
      }
      return []
    }
  },
  mounted () {
    this.controlDataMaker(this.getNutrientSupply)
  },
  methods: {
    getFieldName (index, id) {
      console.log(id)
      for (const field of this.getFields) {
        if (field.id === id) {
          return `${index + 1} - ${field.name}`
        }
      }
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
          if (device.spec.Class === 'nutrient-supply') {
            // eslint-disable-next-line standard/computed-property-even-spacing
            data.level0.control = this.getObservations[
              '1' + device.id.toString().padStart(5, 0) + '06'
            ].nvalue
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
      const item = this._.cloneDeep(this.controlData[device.id][level])

      console.log(item)
      if (item !== undefined) {
        item.ec = Number(item.ec)
        item.ph = Number(item.ph)
        item.sec = Number(item.sec)
        item.startarea = Number(device.place.indexOf(item.startarea) + 1)
        item.stoparea = Number(device.place.indexOf(item.stoparea) + 1)

        if (item.startarea > item.stoparea) {
          this.$notify({
            title: '실패',
            message: '관수 시작 구역을 낮은 번호로 입력 하세요',
            type: 'error'
          })
          return
        }
      }

      let result = this.mqtt.deivceControl(device, control, item)

      if (!result) {
        if (control === cmdCode.nutrient.control) {
          this.$set(
            this.controlData[device.id][level],
            'control',
            !this.controlData[device.id][level].control
          )
        }
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
