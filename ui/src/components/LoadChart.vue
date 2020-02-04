<template>
  <div style="height:100%">
    <div style="display: flex;">
      <div>{{name}}</div>
      <div class="ml-auto el-icon-setting" style="z-index: 1;" @click="showDialog = true"></div>
    </div>
    <Gauge
      v-if="uiInfo[uiType].data.length === 1"
      style="height:100%;margin-top: -25px;"
      :value="obs[uiInfo[uiType].data[0]].nvalue"
    />
    <div v-else  style="height:100%;text-align: center;">
      <div style="margin: 0;top:50%;left:50%;position: absolute;-ms-transform: translateX(-50%) translateY(-50%);transform: translateX(-50%) translateY(-50%);">
        <img src="@/assets/img/nodata.png" style="height:40px"/>
        <br><br>
        <div>선택된 {{name}} 데이터가 없습니다.</div>
      </div>
    </div>
    <Transfer
      :fieldId="fieldId"
      :path="['dashboard',uiType]"
      :uiInfo="uiInfo[uiType]"
      :dataIndexs="getDataIndex"
      :showDialog="showDialog"
      :closeDialog="()=>showDialog = false"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Transfer from '@/components/Transfer'
import Gauge from '@/components/Gauge'
export default {
  props: ['fieldId', 'uiInfo', 'uiType', 'obs', 'name'],
  data () {
    return {
      showDialog: false
    }
  },
  computed: {
    ...mapGetters({
      getDataIndexList: 'dataIndex/getDataIndexList'
    }),
    getDataIndex () {
      let items = []
      for (const dataIndex of this.getDataIndexList) {
        // eslint-disable-next-line eqeqeq
        if (dataIndex.field_id == this.fieldId) {
          items.push(dataIndex)
        }
      }
      return items
    }
  },
  components: {
    Gauge,
    Transfer
  }
}
</script>

<style>
</style>
