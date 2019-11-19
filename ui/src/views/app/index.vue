<template>
  <div style="height:100%">
    <template v-if="isDashboard">
      <Sidebar hidden/>
      <TopDashboard style="width: 100%;top: 0px;"/>
      <transition name="slide-fade">
        <router-view />
      </transition>
    </template>
    <template v-else>
      <Sidebar />
      <div class="page-container">
        <Top />
        <main class="main-content bgc-grey-100">
          <div class="container-fluid" style="padding-left: 0px;padding-right: 0px;">
            <transition name="slide-fade">
              <router-view />
            </transition>
          </div>
        </main>
        <Footer />
      </div>
    </template>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import Sidebar from '@/components/layout/Sidebar'
import Top from '@/components/layout/Top'
import TopDashboard from '@/components/layout/TopDashboard'
import Footer from '@/components/layout/Footer'
export default {
  components: {
    Sidebar,
    TopDashboard,
    Top,
    Footer
  },
  data () {
    return {}
  },
  computed: {
    ...mapGetters({
      getCvtgate: 'cvtgate/getCvtgate',
      getDeviceCouple: 'cvtgate/getDeviceCouple'
    }),
    isDashboard () {
      return this.$route.path === '/dashboard'
    }
  },
  watch: {
    /* getCvtgate (newValue, oldValue) {
      if (newValue.uuid !== oldValue.uuid && newValue.couple !== oldValue.couple) {
        this.mqtt.mqttClose()
        this.mqtt.mqttRefresh()
      }
    }, */
    getDeviceCouple (newValue, oldValue) {
      if (this.mqtt.isConnected()) {
        this.mqtt.mqttSubscribe()
      } else {
        this.mqtt.mqttRefresh()
      }
    }
  },
  methods: {
    ...mapActions({
      fetchDataField: 'field/fetchDataField',
      fetchDataObservations: 'observation/fetchDataObservations',
      fetchDataFarm: 'farm/fetchDataFarm',
      fetchDataCvtgate: 'cvtgate/fetchDataCvtgate',
      fetchDataCoupleList: 'cvtgate/fetchDataCoupleList',
      fetchDataIndex: 'dataIndex/fetchDataIndex'
    })
  },
  mounted () {
    this.fetchDataCvtgate()
    this.fetchDataCoupleList()
    this.fetchDataFarm()
    this.fetchDataField()
    this.fetchDataObservations()
    this.fetchDataIndex()
  }
}
</script>
