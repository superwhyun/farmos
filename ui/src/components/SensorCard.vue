<template>
  <b-card header-tag="header">
    <div slot="header" class="mb-0">
      <div style="display: flex;align-items: center;">
        {{field.name}}
        <div class="ml-auto">
          <span
            v-if="getAllDevices.length > 0 && uiInfo.isFull"
          >출력 데이터를 선택 하세요&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <el-button size="mini" icon="ti-settings" @click="showDialog = true" circle></el-button>
        </div>
      </div>
    </div>
    <b-row>
      <div v-if="getAllDevices.length === 0" class="ml-3">No Data</div>
      <template v-for="(device,idx) in getShowObservations">
        <b-col :lg="12/count" md="4" sm="4" cols="6" :key="idx" class="whs-nw mt-3 mb-3">
          <el-tooltip
            effect="light"
            v-if="differenceInSeconds(new Date(),$date().parse(getObservations[(1 * 10000000) + (device.id * 100)].obs_time)) > 300"
            :content="$date().format($date().parse(getObservations[(1 * 10000000) + (device.id * 100)].obs_time),'YY-MM-DD HH:MM') + '  5분 이전 데이터 입니다'"
            placement="top-start"
          >
            <el-badge value="!" class="item w-100" type="warning">
              <div
                class="textTitle ta-c"
              >{{device.name && device.name.length>0 ? device.name : device.spec.Name}}</div>
            </el-badge>
          </el-tooltip>
          <div
            v-else
            class="textTitle ta-c"
          >{{device.name && device.name.length>0 ? device.name : device.spec.Name}}</div>
          <div
            style="margin-top:10px;margin-bottom:10px;height: 1px;width: 100%;background-color: #DCDFE6;"
          ></div>
          <div v-for="(data,dataIdx) in device.datas" :key="dataIdx">
            <div
              v-if="uiInfo.isFull || (uiInfo.device[device.id] && uiInfo.device[device.id].includes(Number(data.id)))"
            >
              <div class="ml-2 mr-2 mb-1">
                <template v-if="data.unit === '상태'">
                  <DeviceState class="mb-2" :value="getObsData(getObservations[Number(data.id)])" />
                </template>
                <template v-else>
                  <colorTemplate :value="getObsData(getObservations[Number(data.id)])">
                    <div class="ml-2 mr-2 mb-1" style="display: flex;align-items: center;">
                      {{data.name}}
                      <div
                        class="ml-auto"
                        style="color:#595d6e;"
                      >{{getObsData(getObservations[Number(data.id)])}}</div>
                    </div>
                  </colorTemplate>
                </template>
              </div>
            </div>
          </div>
        </b-col>
      </template>
      <template v-for="data in uiInfo.data">
        <b-col :lg="12/count" md="4" sm="4" cols="6" :key="data" class="whs-nw mt-3 mb-3">
          <div
            class="textTitle ta-c"
            v-if="getObservations[Number(data)]"
          >{{getObservations[Number(data)].name}}</div>
          <div
            style="margin-top:10px;margin-bottom:10px;height: 1px;width: 100%;background-color: #DCDFE6;"
          ></div>
          <div class="ml-2 mr-2 mb-1" style="display: flex;align-items: center;">
            <div
              class="ml-auto"
              style="color:#595d6e;"
            >{{getObsData(getObservations[Number(data)])}}</div>
          </div>
        </b-col>
      </template>
    </b-row>
    <Transfer
      :fieldId="field.id"
      :path="path"
      :uiInfo="uiInfo"
      :devices="getAllDevices"
      :dataIndexs="getDataIndex"
      :showDialog="showDialog"
      :closeDialog="()=>showDialog = false"
      :refresh="useDeviceMake"
    />
  </b-card>
</template>

<script>
import { differenceInSeconds } from 'date-fns'
import colorTemplate from '@/components/colorTemplate'
import Transfer from '@/components/Transfer'
import DeviceState from '@/components/DeviceState'
import { statusCode } from '@/constants/config'
import { mapGetters } from 'vuex'
export default {
  props: ['field', 'path', 'count'],
  components: {
    colorTemplate,
    DeviceState,
    Transfer
  },
  data () {
    return {
      differenceInSeconds: differenceInSeconds,
      statusCode: statusCode,
      toggleWait: false,
      showDialog: false,
      uiInfo: {}
    }
  },
  mounted () {
    this.useDeviceMake()
  },
  methods: {
    useDeviceMake () {
      const pathResult = this.path.reduce((object, currentValue) => {
        return object[currentValue]
      }, this._.cloneDeep(this.field.uiinfo))
      this.uiInfo = pathResult
    },
    getObsData (data) {
      if (data) {
        if (data.unit === '상태') {
          return this.statusCode[data.nvalue]
        } else {
          const value = Math.pow(10, data.sigdigit)
          return `${Math.floor(data.nvalue * value) / value} ${
            data.unit ? data.unit : ''
          }`
        }
      } else {
        return '---'
      }
    },
    checkType (type, device) {
      if (type === 'greenhouse') {
        if (device.spec.Class === 'sensor') {
          return true
        }
        return false
      } else if (type === 'actuator') {
        if (
          device.spec.Class === 'actuator' ||
          device.spec.Class === 'nutrient-supply'
        ) {
          return true
        }
        return false
      } else {
        return true
      }
    }
  },
  computed: {
    ...mapGetters({
      getAllFieldDevices: 'device/getAllFieldDevices',
      getObservations: 'observation/getObservations',
      getDataIndexList: 'dataIndex/getDataIndexList'
    }),
    getDataIndex () {
      let items = []
      for (const dataIndex of this.getDataIndexList) {
        // eslint-disable-next-line eqeqeq
        if (dataIndex.field_id == this.field.id) {
          items.push(dataIndex)
        }
      }
      return items
    },
    getShowObservations () {
      const devices = this.getAllFieldDevices[this.field.id]
      let showObservations = []
      if (!devices) return []

      if (!this.uiInfo.isFull) {
        for (const sensorId in this.uiInfo.device) {
          for (const device of devices) {
            if (device.id === Number(sensorId)) {
              showObservations.push(device)
            }
          }
        }
        return showObservations
      } else {
        for (const device of devices) {
          if (this.checkType(this.path[1], device)) {
            showObservations.push(device)
          }
        }
        return showObservations
      }
    },
    getAllDevices () {
      let item = this.getAllFieldDevices[this.field.id]

      if (item === undefined) {
        return []
      }

      const newItem = []
      item.forEach(device => {
        if (this.checkType(this.path[1], device)) {
          newItem.push(device)
        }
      })
      return newItem
    }
  }
}
</script>

<style scoped>
.textTitle {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 0;
  color: #595d6e;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.el-dialog__wrapper >>> .el-dialog__body {
  padding-top: 10px;
}

.box {
  z-index: 0;
}

.box::before {
  content: "";
  position: absolute;
  z-index: -1;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgb(0, 255, 85);
  opacity: 0;
  transition: opacity 0.2s linear;
}

.box:hover::before {
  opacity: 0.2;
}
</style>
