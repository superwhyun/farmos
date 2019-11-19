<template>
  <div class="container">
      <b-row>
        <b-col xs="12" class="mx-auto my-auto">
          <h1>초기 설정</h1>
          <div class="separator mb-5"></div>
          <b-card>
            <el-steps :active="nowPage" align-center>
              <el-step title="Step 1" description="관리 정보"></el-step>
              <el-step title="Step 2" description="농장 정보"></el-step>
              <el-step title="Step 3" description="온실 정보"></el-step>
            </el-steps>
            <transition name="slide-fade">
              <component class="mt-5" :is="currentView" @nextBtn="nextBtn"></component>
            </transition>
          </b-card>
        </b-col>
      </b-row>
    </div>
</template>
<script>

import Register from '@/components/Register'
import FarmInfo from '@/components/FarmInfo'
import Place from '@/components/Place'

export default {
  data () {
    return {
      currentView: Register,
      nowPage: 1
    }
  },
  watch: {
    nowPage (newV, oldV) {
      if (newV === 1) {
        this.currentView = Register
      } else if (newV === 2) {
        this.currentView = FarmInfo
      }
      if (newV === 3) {
        this.currentView = Place
      }
    }
  },
  components: {
    Register,
    FarmInfo
  },
  computed: {},
  methods: {
    nextBtn () {
      this.nowPage++
    }
  },
  mounted () {

  }
}
</script>
