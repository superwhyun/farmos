<template>
  <div style="padding:15px">
    <h4 class="c-grey-900 mB-30">기상 정보</h4>
    <b-row class="mb-2">
      <b-col>
        <Weather />
      </b-col>
    </b-row>
    <b-row class="mb-2">
      <b-col>
        <h4 class="c-grey-900 mT-30">외부 상황</h4>
        <div v-for="local in getLocal" :key="local.id">
          <SensorCard :count="6" class="mb-2" :field="local" :path="['index','local']" />
        </div>
      </b-col>
    </b-row>
    <b-row class="mb-2">
      <b-col lg="7">
        <h4 class="c-grey-900 mT-30">온실 상황</h4>
        <div v-for="house in getGreenHouse" :key="house.id">
          <SensorCard :count="4" class="mb-2" :field="house" :path="['index','greenhouse']" />
        </div>
      </b-col>
      <b-col lg="5">
        <h4 class="c-grey-900 mT-30">구동기 상황</h4>
        <div v-for="house in getGreenHouse" :key="house.id">
          <SensorCard :count="3" class="mb-2" :field="house" :path="['index','actuator']" />
        </div>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Weather from '@/components/Weather'
import SensorCard from '@/components/SensorCard'
export default {
  data () {
    return {
    }
  },
  components: {
    Weather,
    SensorCard
  },
  computed: {
    ...mapGetters({ getFields: 'field/getFields' }),
    getGreenHouse () {
      return this.getFields.filter(item => item.fieldtype === 'greenhouse')
    },
    getLocal () {
      return this.getFields.filter(item => item.fieldtype === 'local')
    }
  },
  mounted () {

  }
}
</script>

<style lang="scss" scoped>
</style>
