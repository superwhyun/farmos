<template>
  <div class="col-xxs-12 mx-auto my-auto" style="padding:15px">
    <h4 class="c-grey-900">장비 관리</h4>

    <b-row class="mb-3">
      <b-col xxs="12">
        <!-- <b-button class="float-right" @click="clickDelete">삭제</b-button> -->
        <b-button @click="clickDelete" class="mr-2">삭제</b-button>
        <!-- <b-button @click="clickManual">수동장비 동기화</b-button> -->
      </b-col>
    </b-row>

    <div>
      <b-row>
        <template>
          <b-col xxs="12">
            <modifyDeviceTree ref="deviceTree" />
          </b-col>
        </template>
      </b-row>
    </div>
  </div>
</template>

<script>
import modifyDeviceTree from '@/components/modifyDeviceTree'
import { mapGetters } from 'vuex'
export default {
  components: {
    modifyDeviceTree
  },
  data: function () {
    return {}
  },
  computed: {
    ...mapGetters({
      getFields: 'field/getFields'
    })
  },
  methods: {
    /* async clickManual () {
      try {
        await this.axios.put('device/manual')
        this.$notify({
          title: '성공',
          message: '수동 장비 동기화를 하였습니다',
          type: 'success'
        })
      } catch (error) {
        this.$notify({
          title: '실패',
          message: '수동 장비 동기화 실패 하였습니다',
          type: 'error'
        })
      }
      this.$store.dispatch('observation/fetchDataObservations')
    }, */
    async clickDelete () {
      try {
        let result = this.$refs.deviceTree.getCheckNode()
        result.forEach(element => {
          delete element.children
        })

        if (result.length === 0) {
          this.$notify({
            title: '경고',
            message: '장비를 선택 하세요.',
            type: 'warning'
          })
          return
        }
        const { data } = await this.axios.delete('device', { data: result })

        if (data.result) {
          this.$notify({
            title: '성공',
            message: '장비를 삭제 하였습니다.',
            type: 'success'
          })
          this.$refs.deviceTree.getDevices(true)
          this.$store.dispatch('device/fetchDataDevice')
          this.$store.dispatch('observation/fetchDataObservations')
        } else {
          this.$notify({
            title: '실패',
            message: '장비가 구역에 등록 되어 있습니다. 제거를 먼저 하세요.',
            type: 'error'
          })
        }
      } catch (error) {
        console.log(error)
      }
    }
  }
}
</script>
