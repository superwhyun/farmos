<template>
  <div style="padding-top:65px;height:100%">
    <div v-if="greenHouse.length === 0" style="height:100%;text-align: center;">
      <div style="margin: 0;top:50%;left:50%;position: absolute;-ms-transform: translateX(-50%) translateY(-50%);transform: translateX(-50%) translateY(-50%);">
        <img src="@/assets/img/nodata.png" style="height:250px"/>
        <br>
        <h2>구역 데이터가 없습니다.</h2><br><h2>구역을 추가 하세요.</h2>
      </div>
    </div>
    <template v-else>
      <Transfer :dialogTableVisible="dialogTableVisible" />
      <swiper :options="swiperOption" style="height:100%">
        <swiper-slide v-for="house in greenHouse" :key="house.id">
          <div style="height:100%">
            <div class="row pT-20 pB-20">
              <div class="col-lg-12">
                <!-- <div class="my-sub-title pL-20"># 실시간 센서</div> -->
                <b-card>
                  <div v-if="getSensor[house.id].length === 0">
                    <img src="@/assets/img/nodata.png" class="mr-3" style="height:20px;"/>등록된 센서 데이터가 없습니다.
                  </div>
                  <infinite-slide-bar duration="60s" v-else>
                    <div class="items">
                      <div v-for="item in getSensor[house.id]" :key="item.id">
                        <div>
                          <div
                            class="pL-15 pR-15 text-muted"
                            :value="observationData[(100000 + item.id) * 100 + 1].nvalue"
                          >{{item.name}}</div>
                          <colorTemplate
                            :value="observationData[(100000 + item.id) * 100 + 1] | digit"
                            class="pL-15 pR-15"
                          >
                            <div style="font-size:20px">
                              {{observationData[(100000 + item.id) * 100 + 1] | digit}}
                              <preValue :value="observationData[(100000 + item.id) * 100 + 1]"></preValue>
                            </div>
                          </colorTemplate>
                        </div>
                      </div>
                    </div>
                  </infinite-slide-bar>
                </b-card>
              </div>
            </div>
            <div class="row" style="height:90%">
              <div class="col-lg-6" style="height:95%">
                <b-card style="height:100%">
                  <div class="row" style="height:35%;">
                    <div class="col-lg-6" style="padding:0px;">
                      <LoadChart
                        style="height:100%"
                        :fieldId="house.id"
                        :uiInfo="house.uiinfo['dashboard']"
                        uiType="ventilation"
                        :obs="observationData"
                        name="환기 부하"
                      />
                    </div>
                    <div class="col-lg-6" style="padding-right:0px">
                      <LoadChart
                        style="height:100%"
                        :fieldId="house.id"
                        :uiInfo="house.uiinfo['dashboard']"
                        uiType="heating"
                        :obs="observationData"
                        name="난방 부하"
                      />
                    </div>
                  </div>
                  <!-- style="min-height:35%;margin-bottom:1% -->
                  <!-- style="height:61%;" class="pB-20" -->
                  <HouseTempChart
                    style="height:60%;"
                    :uiInfo="house.uiinfo['dashboard']"
                    uiType="temp"
                    :sensor="getSensor[0].concat(getSensor[house.id])"
                    :field="house"
                    :obs="observationData"
                    name="온실 온도"
                  />
                </b-card>
              </div>
              <div class="col-lg-6" style="height:95%">
                <b-card style="height:100%">
                  <div class="row" style="height:50%">
                    <div class="col-lg-6" style="padding:0px;height:100%">
                      <Retractable
                        v-if="house.uiinfo['dashboard'].retractable.type.select === 'ratio'"
                        style="height:100%"
                        :uiInfo="house.uiinfo['dashboard'].retractable"
                        :obs="observationData"
                        :device="deviceField[house.id]"
                        :item="getRetractable[house.id]"
                        path="retractable"
                        type="ratio"
                        :fieldId="house.id"
                      />
                      <RetSwitch
                        v-if="house.uiinfo['dashboard'].retractable.type.select === 'time'"
                        style="height:100%"
                        :uiInfo="house.uiinfo['dashboard'].retractable"
                        :obs="observationData"
                        :device="deviceField[house.id]"
                        :item="getRetractable[house.id]"
                        path="retractable"
                        type="time"
                        :fieldId="house.id"
                      />
                    </div>
                    <div class="col-lg-6" style="height:100%">
                      <div v-if="getRetractable[house.id].length === 0">
                        <div style="height:100%;text-align: center;">
                          <div style="margin: 0;top:50%;left:50%;position: absolute;-ms-transform: translateX(-50%) translateY(-50%);transform: translateX(-50%) translateY(-50%);">
                            <img src="@/assets/img/nodata.png" style="height:40px"/>
                              <br><br>
                              <div>등록된 개폐기 데이터가 없습니다.</div>
                          </div>
                        </div>
                      </div>
                      <Hooper v-else
                        :autoPlay="true"
                        :infiniteScroll="true"
                        :playSpeed="5000"
                        :transition="1000"
                        style="height:100%"
                      >
                        <Slide v-for="slide in slideCount(getRetractable[house.id])" :key="slide">
                          <div v-for="item in 5" :key="item">
                            <div
                              v-if="getRetractable[house.id][((slide-1)*5)+item-1]"
                              class="mT-10 pL-20"
                            >
                              <div
                                v-if="house.uiinfo['dashboard'].retractable.type.select === 'ratio'"
                              >
                                <div class="mB-5" style="font-weight: 900">
                                  {{getRetractable[house.id][((slide-1)*5)+item-1].name}}
                                  <DeviceState
                                    :wrap="true"
                                    :value="getObsData(observationData[(100000 + getRetractable[house.id][((slide-1)*5)+item-1].id) * 100])"
                                  />
                                </div>
                                <el-progress
                                  v-if="observationData[(100000 + getRetractable[house.id][((slide-1)*5)+item-1].id) * 100 + 2]"
                                  :text-inside="true"
                                  :stroke-width="26"
                                  :percentage="sigdigt(observationData[(100000 + getRetractable[house.id][((slide-1)*5)+item-1].id) * 100 + 2])"
                                ></el-progress>
                              </div>
                              <div
                                v-if="house.uiinfo['dashboard'].retractable.type.select === 'time'"
                              >
                                <div class="mB-5" style="font-weight: 900">
                                  {{getRetractable[house.id][((slide-1)*5)+item-1].name}}
                                  <DeviceState
                                    :wrap="true"
                                    :value="getObsData(observationData[(100000 + getRetractable[house.id][((slide-1)*5)+item-1].id) * 100])"
                                  />
                                </div>
                                <template v-if="observationData[(100000 + getRetractable[house.id][((slide-1)*5)+item-1].id) * 100 + 4]">
                                  남은 시간 {{observationData[(100000 + getRetractable[house.id][((slide-1)*5)+item-1].id) * 100 + 4].nvalue}}초
                                </template>
                                <template>
                                  남은시간 미지원
                                </template>
                                <br />
                              </div>
                            </div>
                          </div>
                        </Slide>
                      </Hooper>
                    </div>
                  </div>
                  <div class="row" style="height:50%">
                    <div class="col-lg-6" style="padding:0px;">
                      <RetSwitch
                        style="height:100%"
                        :uiInfo="house.uiinfo['dashboard'].switch"
                        :obs="observationData"
                        :device="deviceField[house.id]"
                        :item="getSwitch[house.id]"
                        :fieldId="house.id"
                        path="switch"
                      />
                    </div>
                    <div class="col-lg-6" style="height:100%">
                      <div v-if="getSwitch[house.id].length === 0">
                        <div style="height:100%;text-align: center;">
                          <div style="margin: 0;top:50%;left:50%;position: absolute;-ms-transform: translateX(-50%) translateY(-50%);transform: translateX(-50%) translateY(-50%);">
                            <img src="@/assets/img/nodata.png" style="height:40px"/>
                              <br><br>
                              <div>등록된 스위치 데이터가 없습니다.</div>
                          </div>
                        </div>
                      </div>
                      <Hooper
                        v-else
                        :autoPlay="true"
                        :infiniteScroll="true"
                        :playSpeed="5000"
                        :transition="1000"
                        style="height:100%"
                      >
                        <Slide v-for="slide in slideCount(getSwitch[house.id])" :key="slide">
                          <div v-for="item in 5" :key="item">
                            <div
                              v-if="getSwitch[house.id][((slide-1)*5)+item-1]"
                              class="mT-10 pL-20"
                            >
                              <div>
                                <div class="mB-5" style="font-weight: 900">
                                  {{getSwitch[house.id][((slide-1)*5)+item-1].name}}
                                  <DeviceState
                                    :wrap="true"
                                    :value="getObsData(observationData[(100000 + getSwitch[house.id][((slide-1)*5)+item-1].id) * 100])"
                                  />
                                </div>
                                <template v-if="observationData[(100000 + getSwitch[house.id][((slide-1)*5)+item-1].id) * 100 + 4]">
                                  남은 시간 {{observationData[(100000 + getSwitch[house.id][((slide-1)*5)+item-1].id) * 100 + 4].nvalue}}초
                                </template>
                                <template>
                                  남은시간 미지원
                                </template>
                                <br />
                              </div>
                            </div>
                          </div>
                        </Slide>
                      </Hooper>
                    </div>
                  </div>
                </b-card>
              </div>
            </div>
          </div>
        </swiper-slide>
      </swiper>

      <div class="swiper-pagination" slot="pagination "></div>
      <div class="swiper-button-prev" slot="button-prev "></div>
      <div class="swiper-button-next" slot="button-next "></div>
    </template>
  </div>
</template>

<script>
/* eslint-disable standard/computed-property-even-spacing */
import preValue from '@/components/preValue'
import colorTemplate from '@/components/colorTemplate'
import { statusCode } from '@/constants/config'
import DeviceState from '@/components/DeviceState'
import screenfull from 'screenfull'
import Transfer from '@/components/Transfer'
import Retractable from '@/components/Retractable'
import RetSwitch from '@/components/Switch'
import LoadChart from '@/components/LoadChart'
import HouseTempChart from '@/components/HouseTempChart'
import { swiper, swiperSlide } from 'vue-awesome-swiper'
import 'swiper/dist/css/swiper.css'
import { Hooper, Slide } from 'hooper'
import 'hooper/dist/hooper.css'

export default {
  components: {
    preValue,
    colorTemplate,
    DeviceState,
    swiper,
    swiperSlide,
    Retractable,
    RetSwitch,
    LoadChart,
    Hooper,
    Slide,
    Transfer,
    HouseTempChart
  },
  computed: {
    fields () {
      return this.$store.getters['field/getFields']
    },
    greenHouse () {
      return this.fields.filter(item => item.fieldtype === 'greenhouse')
    },
    observationData () {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      return this.$store.getters['observation/getObservations']
    },
    deviceData () {
      return this.$store.getters['device/getData']
    },
    deviceField () {
      return this.$store.getters['device/getAllFieldDevices']
    },
    fieldData () {
      let dataItems = {}
      for (const key in this.deviceField) {
        dataItems[key] = []
        const devics = this.deviceField[key]
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
      }
      return dataItems
    },
    getSensor () {
      let device = {}
      if (this.deviceField) {
        for (const field in this.deviceField) {
          device[field] = this.deviceField[field].filter(device => {
            return device.spec.Class === 'sensor'
          })
        }
      }
      return device
    },
    getRetractable () {
      let device = {}
      if (this.deviceField) {
        for (const field in this.deviceField) {
          device[field] = this.deviceField[field].filter(device => {
            return (
              device.spec.Class === 'actuator' &&
              device.spec.Type.startsWith('retractable')
            )
          })
        }
      }
      return device
    },
    getSwitch () {
      let device = {}
      if (this.deviceField) {
        for (const field in this.deviceField) {
          device[field] = this.deviceField[field].filter(device => {
            return (
              device.spec.Class === 'actuator' &&
              device.spec.Type.startsWith('switch')
            )
          })
        }
      }
      return device
    }
  },
  data () {
    let self = this
    return {
      statusCode: statusCode,
      dialogTableVisible: false,
      activeName: 'retractable',
      tempObservationData: {},
      activeIndex: 0,
      swiperOption: {
        /* autoplay: 3000, */
        initialSlide: 0,
        loop: false,
        autoplayDisableOnInteraction: false,
        grabCursor: true,
        /* setWrapperSize: true,
          autoHeight: true, */
        mousewheelControl: true,
        paginationClickable: true,
        spaceBetween: 30,
        pagination: {
          el: '.swiper-pagination',
          type: 'progress'
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        },
        on: {
          slideChange () {
            self.activeIndex = this.activeIndex
          }
        }
      }
    }
  },
  watch: {
    observationData (newValue, oldValue) {
      for (const key in newValue) {
        if (!this.tempObservationData.hasOwnProperty(key)) {
          this.tempObservationData[key] = newValue[key]
        }
        if (this.tempObservationData[key].nvalue !== newValue[key].nvalue) {
          this.tempObservationData[key].nvalue = newValue[key].nvalue
        }
      }
      // this.tempObservationData = this._.cloneDeep(newValue)
    }
  },
  created () {
    screenfull.request()
  },
  destroyed () {
    screenfull.exit()
  },
  mounted () {},
  methods: {
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
    setUiinfo (type) {
      this.dialogTableVisible = true
    },
    switchTime (data1, data2) {
      if (isNaN(data1 / data2)) {
        return 0
      }
      return Math.round((data1 / data2) * 100)
    },
    slideCount (data) {
      return Math.ceil(data.length / 5)
    },
    sigdigt (data) {
      const value = Math.pow(10, data.sigdigit)
      return Math.floor(data.nvalue * value) / value
    },
    color (index) {
      if (index % 4 === 0) {
        return 'bg-primary-400'
      } else if (index % 4 === 1) {
        return 'bg-danger-400'
      } else if (index % 4 === 2) {
        return 'bg-indigo-400'
      } else if (index % 4 === 3) {
        return 'bg-success-400'
      }
    }
  }
}
</script>

<style scoped>
div >>> .el-progress-bar__innerText {
  color: rgba(27, 61, 252, 0.712);
}
.my-sub-title {
  font-size: 21px;
}
.my-sub-title,
.my-title {
  float: left;
  width: 100%;
  font-weight: 700;
  margin: 10px 0;
}
.items {
  display: flex;
  justify-content: space-around;
}
</style>

<style>
/* .navbar {
  margin-bottom: 5px !important;
} */

.navbar-nav.navbar-center {
  position: absolute;
  left: 50%;
  -webkit-transform: translatex(-50%);
  transform: translatex(-50%);
}

.dashboard {
  height: calc(100% - 65px);
}

.progress-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.progress-list > li + li {
  margin-top: 20px;
}

.progress-list > li > label {
  display: block;
}

.progress-list > li span {
  float: right;
  display: block;
}
</style>
