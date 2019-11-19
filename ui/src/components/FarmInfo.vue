<template>
  <b-card no-body class="p-20">
    <div class="mb-5">
      <div class="float-left">
        <div class="d-inline-block">
          <h5 class="d-inline">농장 정보</h5>
        </div>
      </div>
      <el-button class="float-right" type="primary" @click="formSubmit">변경</el-button>
    </div>

    <el-form label-position="left" label-width="80px" v-if="getFarm.info">
      <el-form-item label="농장주" class="mb-1">
        <el-input v-model="getFarm.name"></el-input>
      </el-form-item>
      <el-form-item label="연락처" class="mb-0">
        <el-input v-model="getFarm.info.telephone"></el-input>
      </el-form-item>
      <el-form-item label="주소" class="mb-0">{{getFarm.info.address}}</el-form-item>
      <el-button @click="handlePost" class="w-100">주소 검색</el-button>

      <transition name="slide-fade">
        <VueDaumPostcode
          v-if="viewDaumPost"
          @complete="postResult"
          :animation="false"
          :hide-eng-btn="false"
        />
      </transition>
    </el-form>
  </b-card>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  components: {},
  data () {
    return {
      viewDaumPost: false
    }
  },
  computed: {
    ...mapGetters({
      getFarm: 'farm/getFarm'
    })
  },
  methods: {
    postResult (addressResult) {
      // eslint-disable-next-line no-undef
      var geocoder = new daum.maps.services.Geocoder()
      let self = this
      geocoder.addressSearch(addressResult.address, function (
        gpsResult,
        status
      ) {
        if (status === 'OK') {
          self.getFarm.info.address = addressResult.address
          self.getFarm.info.postcode = addressResult.zonecode
          self.getFarm.info.gps = `${gpsResult[0].y},${gpsResult[0].x}`
          self.viewDaumPost = false
        } else {
          self.$notify({
            title: '실패',
            message: '좌표 변환을 실패 하였습니다 주소 검색을 다시 해 주세요',
            type: 'error'
          })
        }
      })
    },
    handlePost () {
      this.viewDaumPost = true
    },
    async formSubmit () {
      try {
        await this.axios.put('farm', this.getFarm)
        this.$emit('done')
      } catch (error) {
        console.log(error)
      }
    }
  },
  async mounted () {

  }
}
</script>
