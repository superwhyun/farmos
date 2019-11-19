<template>
  <div>
    <el-input
      placeholder="주소를 검색해 주세요"
      v-model="address"
      class="mB-20"
      @keyup.enter.native="gpsSearch"
    >
      <el-button slot="append" icon="el-icon-search" @click="gpsSearch"></el-button>
    </el-input>

    <vue-daum-map
      :appKey="appKey"
      :libraries="['services']"
      :center.sync="center"
      :level.sync="level"
      :mapTypeId="mapTypeId"
      @load="onLoad"
      style="height:300px;"
    ></vue-daum-map>
  </div>
</template>

<script>
import { daumMapApiKey } from '@/constants/config'
import VueDaumMap from 'vue-daum-map'

export default {
  props: {
    index: Number,
    lat: {
      type: Number,
      default: 33.450701
    },
    lng: {
      type: Number,
      default: 126.570667
    }
  },
  components: {
    VueDaumMap
  },
  data () {
    return {
      address: '',
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
    this.center.lat = this.lat
    this.center.lng = this.lng
  },
  methods: {
    clear () {
      this.address = ''
      this.center = { lat: 33.450701, lng: 126.570667 }
      this.level = 3
      this.onLoad(this.mapObject)
    },
    mapRelayout () {
      this.mapObject.relayout()
    },
    getData () {
      try {
        return { latlng: this.marker.getPosition(), address: this.address }
      } catch (error) {
        return { latlng: null, address: this.address }
      }
    },
    onLoad (map) {
      this.mapObject = map
      // eslint-disable-next-line no-undef
      this.mapPlace = new daum.maps.services.Places()

      // eslint-disable-next-line
      var latlng = new daum.maps.LatLng(this.center.lat, this.center.lng);
      // eslint-disable-next-line
      this.marker = new daum.maps.Marker({
        position: latlng
      })
      this.marker.setMap(this.mapObject)
      this.marker.setDraggable(true)
      // this.mapObject.panTo(latlng)

      // eslint-disable-next-line
      daum.maps.event.addListener(this.marker, "dragend", () => {
        this.$emit('mapResult', {
          address: this.address,
          latlng: this.marker.getPosition(),
          index: this.index
        })
      })
    },
    gpsSearch () {
      this.mapPlace.keywordSearch(this.address, items => {
        if (items === 'ERROR') return
        if (items.length > 0) {
          if (this.marker !== null) {
            this.marker.setMap(null)
          }

          // eslint-disable-next-line
          var latlng = new daum.maps.LatLng(items[0].y, items[0].x);
          // eslint-disable-next-line
          this.marker = new daum.maps.Marker({
            position: latlng
          })
          this.marker.setMap(this.mapObject)
          this.marker.setDraggable(true)
          this.mapObject.panTo(latlng)

          this.$emit('mapResult', {
            address: this.address,
            latlng: latlng,
            index: this.index
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
