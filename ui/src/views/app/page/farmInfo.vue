<template>
  <div class="col-xxs-12 mx-auto my-auto" style="padding:15px">
    <h4 class="c-grey-900 mB-30">농장 정보</h4>
    <el-card>
      <el-row>
        <el-col :span="16">
          <vue-daum-map
            :appKey="appKey"
            :libraries="['services']"
            :center.sync="center"
            :level.sync="level"
            :mapTypeId="mapTypeId"
            @load="onLoad"
            style="height: 600px;"
          ></vue-daum-map>
        </el-col>
        <el-col :span="8">
          <div class="ta-r">
            <!-- <div class="invoice__invoice-detail mt-6">
              <h6 class="el-icon-user">&nbsp;&nbsp;농장주</h6>
              <h5 class="c-grey-600">{{farmItem.name}}</h5>
              <h6 class="el-icon-phone-outline">&nbsp;&nbsp;연락처</h6>
              <h5 class="c-grey-600">{{farmItem.info.telephone}}</h5>
              <h6 class="el-icon-map-location">&nbsp;&nbsp;주소</h6>
              <h5 class="c-grey-600">{{farmItem.address}}</h5>
            </div>-->
          </div>
          <FarmInfo class="ml-4" style="height:600px;overflow-y: auto;" @done="done" />
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script>
import { daumMapApiKey } from '@/constants/config'
import VueDaumMap from 'vue-daum-map'
import { mapGetters } from 'vuex'
import FarmInfo from '@/components/FarmInfo'

export default {
  components: {
    FarmInfo,
    VueDaumMap
  },
  computed: {
    ...mapGetters({
      getFields: 'field/getFields'
    })
  },
  data () {
    return {
      appKey: daumMapApiKey,
      center: { lat: 33.450701, lng: 126.570667 },
      level: 3,
      mapTypeId: VueDaumMap.MapTypeId.NORMAL,
      libraries: [],
      mapObject: null,
      mapPlace: null,
      marker: null
    }
  },
  mounted () {
    window.addEventListener('resize', this.mapRelayout)
  },
  destroyed () {
    window.removeEventListener('resize', this.mapRelayout)
  },
  methods: {
    mapRelayout () {
      this.mapObject.relayout()
    },
    onLoad (map) {
      this.mapObject = map

      // eslint-disable-next-line no-undef
      this.mapPlace = new daum.maps.services.Places()

      // eslint-disable-next-line no-undef
      let bounds = new daum.maps.LatLngBounds()

      this.getFields.forEach(element => {
        if (element.fieldtype !== 'local') {
          // eslint-disable-next-line
          var latlng = new daum.maps.LatLng(
            element.data.lat.value,
            element.data.lng.value
          )

          if (latlng.getLat() && latlng.getLng()) {
            // eslint-disable-next-line
            this.marker = new daum.maps.Marker({
              position: latlng
            })
            this.marker.setMap(this.mapObject)
            this.marker.setDraggable(true)

            let content = `<div class="el-card is-always-shadow mb-5 p-5"> <span class="title">${element.name}</span></div>`

            // eslint-disable-next-line
            new daum.maps.CustomOverlay({
              map: this.mapObject,
              position: latlng,
              content: content,
              yAnchor: 1
            })

            bounds.extend(latlng)
            this.mapObject.setBounds(bounds)
          }
        }
      })
    },
    done () {
      this.$notify({
        title: '성공',
        message: '농장 정보 수정 하였습니다.',
        type: 'success'
      })
    }
  }
}
</script>

<style lang="scss">
</style>
