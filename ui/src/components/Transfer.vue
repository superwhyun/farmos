<template>
  <el-dialog
    :modal-append-to-body="false"
    :show-close="false"
    :visible.sync="showDialogCopy"
    @closed="()=>closeDialog()"
    center
  >
    <div slot="title">
      <h6>UI 표시 데이터</h6>
    </div>

    <div v-if="uiInfo">
      <div v-if="uiInfo.type" class="mB-20">
        <h3>타입</h3>
        <el-select v-model="uiInfo.type.select" placeholder="타입을 선택 하세요" class="mb w-100" @change="typeSelect">
          <el-option v-for="item in uiInfo.type.list" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </div>
      <div v-if="!uiInfo.type || uiInfo.type.select !== null">
        <h3>장비</h3>
        <b-row>
          <b-col lg="6" v-for="device in devices" :key="device.id">
            <h5 style="font-weight: 600">{{device.name ? device.name : device.spec.Name}}</h5>
            <template v-for="data in device.datas">

              <template v-if="!uiInfo.type">
                <el-checkbox
                  v-if="checkIdfmt(uiInfo.idfmt.device ,data)"
                  :key="data.id"
                  :checked="uiInfo.device[device.id] && uiInfo.device[device.id].includes(Number(data.id))"
                  :label="data.name"
                  :disabled="isMax && !(uiInfo.device[device.id] && uiInfo.device[device.id].includes(Number(data.id)))"
                  @change="deviceSelect(device.id,data.id)"
                ></el-checkbox>
              </template>
              <template v-else>
                <el-checkbox
                  v-if="checkIdfmt(uiInfo[uiInfo.type.select].idfmt.device,data)"
                  :key="data.id"
                  :checked="uiInfo[uiInfo.type.select].device[device.id] && uiInfo[uiInfo.type.select].device[device.id].includes(Number(data.id))"
                  :label="data.name"
                  :disabled="isMax && !(uiInfo[uiInfo.type.select].device[device.id] && uiInfo[uiInfo.type.select].device[device.id].includes(Number(data.id)))"
                  @change="deviceSelect(device.id,data.id)"
                ></el-checkbox>
              </template>
            </template>
            <el-divider />
          </b-col>
        </b-row>

        <br />
        <h3>데이터</h3>
        <b-row>
          <b-col lg="6" v-for="dataIndex in dataIndexs" :key="dataIndex.id">
            <el-checkbox
              v-if="uiInfo.idfmt && checkIdfmt(uiInfo.idfmt.data,dataIndex)"
              :key="dataIndex.id"
              :checked="uiInfo.data.includes(Number(dataIndex.id))"
              :label="dataIndex.name"
              :disabled="isMax && !uiInfo.data.includes(Number(dataIndex.id))"
              @change="dataSelect(dataIndex.id)"
            ></el-checkbox>
          </b-col>
        </b-row>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { mapActions } from 'vuex'
export default {
  props: [
    'fieldId',
    'path',
    'uiInfo',
    'devices',
    'dataIndexs',
    'showDialog',
    'closeDialog',
    'refresh'
  ],
  data () {
    return {
      showDialogCopy: false
    }
  },
  watch: {
    showDialog (newValue, oldValue) {
      this.showDialogCopy = this.showDialog
    }
  },
  computed: {
    isMax () {
      if (isNaN(this.uiInfo.max)) {
        return false
      } else {
        let deviceCount = Object.keys(this.uiInfo.device).length
        let dataCount = this.uiInfo.data.length
        if (deviceCount + dataCount >= this.uiInfo.max) {
          return true
        } else {
          return false
        }
      }
    }
  },
  methods: {
    ...mapActions({ fetchSetUiDevice: 'field/fetchSetUiDevice' }),
    checkIdfmt (idfmt, item) {
      var re = new RegExp(idfmt)
      return re.test(item.id)
    },
    async typeSelect (type) {
      let tempPath = this.path
      tempPath.push('type')

      await this.fetchSetUiDevice([
        this.fieldId,
        tempPath,
        null,
        null,
        this.uiInfo.type.select
      ])

      try {
        this.refresh()
      } catch (error) {}
    },
    async dataSelect (dataId) {
      let tempData = null
      let tempPath = this.path

      if (this.uiInfo.type) {
        tempData = this.uiInfo[this.uiInfo.type.select]
        tempPath.push(this.uiInfo.type.select)
      } else {
        tempData = this.uiInfo
      }
      if (tempData.data.includes(Number(dataId))) {
        tempData.data.splice(tempData.data.indexOf(Number(dataId)), 1)
      } else {
        tempData.data.push(Number(dataId))
      }

      tempData.isFull = false

      await this.fetchSetUiDevice([
        this.fieldId,
        tempPath,
        null,
        tempData.data
      ])

      try {
        this.refresh()
      } catch (error) {}
    },
    async deviceSelect (deviceId, dataId) {
      let tempData = null
      let tempPath = this.path

      if (this.uiInfo.type) {
        tempData = this.uiInfo[this.uiInfo.type.select]
        tempPath.push(this.uiInfo.type.select)
      } else {
        tempData = this.uiInfo
      }

      if (!tempData.device[deviceId]) {
        tempData.device[deviceId] = []
      }

      if (tempData.device[deviceId].includes(Number(dataId))) {
        tempData.device[deviceId].splice(
          tempData.device[deviceId].indexOf(Number(dataId)),
          1
        )
      } else {
        tempData.device[deviceId].push(Number(dataId))
      }

      if (tempData.device[deviceId].length === 0) {
        delete tempData.device[deviceId]
      }

      tempData.isFull = false

      await this.fetchSetUiDevice([
        this.fieldId,
        tempPath,
        tempData.device,
        null
      ])
      try {
        this.refresh()
      } catch (error) {}
    }
  }
}
</script>

<style>
</style>
