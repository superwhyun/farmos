<template>
  <div>
    <h5>제약조건을 확인하세요</h5>
    target : {{settingRule.constraints.target}}
    <el-select
      v-if="settingRule.constraints.target === 'field'"
      v-model="selectField"
      placeholder="Select"
      class="mb-4 w-100"
    >
      <template v-for="item in getFields">
        <el-option :key="item.id" :label="item.name" :value="item.id" v-if="item.id>0"></el-option>
      </template>
    </el-select>
    <template v-if="settingRule.constraints.target === 'farm' || selectField > 0">
      devices
      <template v-for="(device,index) in settingRule.constraints.devices">
        <el-select
          v-model="device.deviceid"
          :key="`device${index}`"
          :placeholder="device.desc"
          class="mb-4 w-100"
        >
          <template v-for="item in getShowObservations">
            <el-option
              :key="`${index}_${item.id}`"
              :label="item.name ? item.name : item.spec.Name ? item.spec.Name : item.spec.Type "
              :value="item.id"
            ></el-option>
          </template>
        </el-select>
      </template>
      data
      <template v-for="(data,index) in settingRule.constraints.data">
        <el-select
          v-model="data.dataid"
          :key="`data${index}`"
          :placeholder="data.desc"
          class="mb-4 w-100"
        >
          <template v-for="item in dataindexList">
            <el-option
              :key="`${index}_${item.id}`"
              :label="item.name"
              :value="item.id"
              v-if="checkIdfmt(data.idfmt,item)"
            ></el-option>
          </template>
        </el-select>
      </template>

      <el-button class="mt-2 w-100">생성</el-button>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  props: ['rule'],
  data () {
    return {
      selectField: '',
      settingRule: {},
      dataindexList: []
    }
  },
  computed: {
    ...mapGetters({
      getFields: 'field/getFields',
      getAllFieldDevices: 'device/getAllFieldDevices'
    }),
    getShowObservations () {
      const devices = this.getAllFieldDevices[this.selectField]
      return devices
    }
  },
  beforeMount () {
    let rule = this._.cloneDeep(this.rule)

    rule.constraints.data.forEach(element => {
      element.dataid = ''
    })

    rule.constraints.devices.forEach(element => {
      element.deviceid = ''
    })

    this.$set(this, 'settingRule', rule)
  },
  async mounted () {
    await this.getDataIndex()
  },
  methods: {
    checkIdfmt (idfmt, item) {
      var re = new RegExp(idfmt)
      return re.test(item.id)
    },
    async getDataIndex () {
      try {
        const { data } = await this.axios.get('dataindex')
        this.dataindexList = data
      } catch (error) {
        console.log(error)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.el-col {
  margin-bottom: 20px;
}
</style>
