<template>
  <!-- <div class="col-xxs-12" style="height: calc(100vh - 166px);"> -->
  <div class="col-xxs-12" style="padding:15px">
    <!-- <h4 class="c-grey-900" style="z-index: 10;position: relative;">장비 검색</h4> -->

    <div>
      <SearchLoading ref="loadingView" @cancel="searchCancel" :msg="msg"></SearchLoading>
    </div>

    <el-steps
      :active="getTryReq.progress"
      finish-status="success"
      simple
      style="margin-top: 20px;z-index: 10;position: relative;"
    >
      <el-step title="명령 전송"></el-step>
      <el-step title="검색 중"></el-step>
      <el-step title="검색 완료"></el-step>
    </el-steps>

    <b-row>
      <b-col xxs="12">
        <template v-if="getTryReq.progress === 0">
          <b-row>
            <b-col lg="7">
              <div class="containerSearch">
                <section class="card">
                  <div class="card_inner">
                    <!-- <div class="card_inner__circle">
                      <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/217233/cog.png" />
                    </div>
                    <div class="card_inner__header"></div>-->
                    <div class="card_inner__content">
                      <div class="price">새 장비 검색</div>
                      <div class="text">
                        <br />
                        <br />
                      </div>
                    </div>
                    <div class="card_inner__cta">
                      <div class="play-button-container">
                        <div class="play-button" @click="clickSearch">
                          <div class="el-icon-caret-right" style="font-size: 40px;" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </b-col>
            <b-col lg="5">
              <div class="containerSearch">
                <section class="card">
                  <div class="card_inner">
                    <!-- <div class="card_inner__circle">
                      <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/217233/cog.png" />
                    </div>
                    <div class="card_inner__header"></div>-->
                    <div class="card_inner__content">
                      <div class="price">기존 데이터</div>
                      <div class="text">
                        <br />
                        <br />
                      </div>
                    </div>
                    <div class="card_inner__cta">
                      <div class="play-button-container">
                        <div class="play-button" @click="clickDetect">
                          <div class="el-icon-caret-right" style="font-size: 40px;" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </b-col>
          </b-row>
        </template>
        <template v-else-if="getTryReq.progress === 1">
          <b-row>
            <template v-for="(item,idx) in getDeviceItems">
              <b-col lg="3" :key="idx" class="mt-5">
                <b-card class="ta-c">
                  <h2>검색된 장비</h2>
                  <h3>No. {{idx+1}}번</h3>
                </b-card>
              </b-col>
            </template>
          </b-row>
        </template>
        <template v-else-if="this.getTryReq.progress === 2">
          <b-card-body>
            <div>
              <b-row class="mb-2">
                <b-col xxs="12" class="p-0">
                  <div class="d-flex">
                    <div class>
                      <div class="d-inline-block">
                        <h5 class>장비 리스트</h5>
                        <span class="text-muted text-small d-block">검색된 장비</span>
                      </div>
                    </div>
                    <div class="ml-auto align-self-center">
                      <el-button @click="searchClear">취소</el-button>
                      <el-button @click="save">저장</el-button>
                    </div>
                  </div>
                </b-col>
              </b-row>
              <b-row>
                <b-col xxs="12" class="p-0">
                  <newDeviceTree :devices="detectDevice" ref="deviceTree" />
                </b-col>
              </b-row>
            </div>
          </b-card-body>
        </template>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import newDeviceTree from '@/components/newDeviceTree'
import SearchLoading from '@/components/SearchLoading'
import { mapGetters, mapActions } from 'vuex'
export default {
  components: {
    newDeviceTree,
    SearchLoading
  },
  data: function () {
    return {
      detectDevice: {},
      msg:
        '장비 검색중 입니다.<br>[1.브라우저 종료 2.사이트 갱신 3.타 사이트 접속] 검색이 취소 됩니다.<br>'
    }
  },
  watch: {
    'getTryReq.deviceSearch' (newValue, oldValue) {
      this.progressSet()
    },
    'getTryReq.progress' (newValue, oldValue) {
      this.progressSet()
    },
    getDeviceItemComplate (newValue, oldValue) {
      this.detectDevice = newValue
      this.fetchDataCvtgate()
    }
  },
  computed: {
    ...mapGetters({
      getFields: 'field/getFields',
      getTryReq: 'mqtt/getTryReq',
      getDeviceItems: 'mqtt/getDeviceItems',
      getDeviceItemComplate: 'mqtt/getDeviceItemComplate',
      cvtgateInfo: 'cvtgate/getCvtgate'
    }),
    isSelectedAll () {
      return this.selectedItems.length >= this.items.length
    },
    isAnyItemSelected () {
      return (
        this.selectedItems.length > 0 &&
        this.selectedItems.length < this.items.length
      )
    },
    getFieldName () {
      let name = ''
      /* for (const field of this.getFields) {
        if (field.id == this.currentField) {
          name = field.name
        }
      } */
      return name
    }
  },
  mounted () {
    if (!this.getTryReq.deviceSearch && this.getTryReq.progress === 2) {
      this.detectDevice = JSON.parse(this.cvtgateInfo.detect)
      this.$store.commit('mqtt/setTryReq', [false, 0])
    }
    this.progressSet()
  },
  methods: {
    ...mapActions({
      fetchDataCvtgate: 'cvtgate/fetchDataCvtgate'
    }),
    async save () {
      try {
        let result = this.$refs.deviceTree.getCheckNode()

        result.forEach(element => {
          delete element.children
        })
        await this.axios.post('device', result)
        this.$snotify.success('장비 등록이 완료 되었습니다')
        this.$store.commit('mqtt/setTryReq', [false, 0])
        this.$router.push(`/device`)
        this.$store.dispatch('device/fetchDataDevice')
        this.$store.dispatch('observation/fetchDataObservations')
      } catch (error) {
        console.log(error)
      }
    },
    async progressSet () {
      if (this.getTryReq.deviceSearch && this.getTryReq.progress < 2) {
        this.$refs.loadingView.startLoading()
      } else if (this.getTryReq.deviceSearch && this.getTryReq.progress === 2) {
        this.$snotify.success('장비 검색이 완료 되었습니다.')
        this.$refs.loadingView.stopLoading()
        try {
          await this.axios.put('gateinfo/detect', this.getDeviceItemComplate)
        } catch (error) {
          console.log(error)
        }
      } else {
        this.$refs.loadingView.stopLoading()
      }
    },
    searchCancel () {
      this.mqtt.deivceSearchCancel()
    },
    searchClear () {
      this.$store.commit('mqtt/clearDeviceItem')
      this.$store.commit('mqtt/setTryReq', [false, 0])
    },
    clickSearch () {
      this.mqtt.deivceSearch()
    },
    clickDetect () {
      this.detectDevice = JSON.parse(this.cvtgateInfo.detect)
      this.$store.commit('mqtt/setTryReq', [false, 2])
    },
    clickFieldModify (field) {
      // this.$router.push(`/device/field/${field}`)
      this.mqtt.deivceSearch()
    },
    toggleItem (event, itemId) {
      if (event.shiftKey && this.selectedItems.length > 0) {
        let itemsForToggle = this.items
        var start = this.getIndex(itemId, itemsForToggle, 'id')
        var end = this.getIndex(
          this.selectedItems[this.selectedItems.length - 1],
          itemsForToggle,
          'id'
        )
        itemsForToggle = itemsForToggle.slice(
          Math.min(start, end),
          Math.max(start, end) + 1
        )
        this.selectedItems.push(
          ...itemsForToggle.map(item => {
            return item.id
          })
        )
      } else {
        if (this.selectedItems.includes(itemId)) {
          this.selectedItems = this.selectedItems.filter(x => x !== itemId)
        } else this.selectedItems.push(itemId)
      }
    },
    keymap (event) {
      switch (event.srcKey) {
        case 'select':
          this.selectAll(false)
          break
        case 'undo':
          this.selectedItems = []
          break
      }
    },
    selectAll (isToggle) {
      if (this.selectedItems.length >= this.items.length) {
        if (isToggle) this.selectedItems = []
      } else {
        this.selectedItems = this.items.map(x => x.id)
      }
    },
    successButtonClick () {
      // eslint-disable-next-line promise/param-names
      return new Promise((success, fail) => {
        setTimeout(() => {
          success('장비검색 전송')
        }, 2000)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.containerSearch {
  margin-top: 60px;
}

.containerSearch .card {
  width: 100%;
  margin: 0 auto;
  display: inline-block;
  -webkit-transform: scale(0);
  transform: scale(0);
  text-align: center;
  position: relative;
  transition: all 0.2s;
  cursor: pointer;
  opacity: 1;
  box-shadow: 0px 17px 46px -10px #777777;
  height: 470px;
  border-radius: 14px;
}
.containerSearch .card:nth-of-type(1) {
  -webkit-animation: intro 1s 0.2s forwards;
  animation: intro 1s 0.2s forwards;
}
.containerSearch .card:nth-of-type(1) {
  background: -webkit-linear-gradient(45deg, #89bfdf 0%, #6b6ecc 100%);
}

.containerSearch .card:hover .card_inner__header img {
  left: -50px;
  transition: all 3.4s linear;
}
.containerSearch .card:hover .card_inner__cta button {
  -webkit-transform: scale(1);
  transform: scale(1);
}

.containerSearch .card:nth-of-type(1):hover .card_inner__circle img {
  -webkit-animation: spin 1s forwards;
  animation: spin 1s forwards;
}
.containerSearch .card:nth-of-type(1) .card_inner__circle img {
  top: 22px;
}

.containerSearch .card_inner__circle {
  overflow: hidden;
  width: 70px;
  position: absolute;
  background: #f1f0ed;
  z-index: 10;
  height: 70px;
  border-radius: 100px;
  left: 0;
  box-shadow: 0px 7px 20px rgba(0, 0, 0, 0.28);
  right: 0;
  margin: auto;
  border: 4px solid white;
  top: 82px;
}
.containerSearch .card_inner__circle img {
  height: 26px;
  position: relative;
  top: 17px;
  transition: all 0.2s;
}
.containerSearch .card_inner__header {
  height: 120px;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  overflow: hidden;
}
.containerSearch .card_inner__header img {
  width: 120%;
  position: relative;
  top: -30px;
  left: 0;
  transition: all 0.1s linear;
}
.containerSearch .card_inner__content {
  padding: 20px;
}
.containerSearch .card_inner__content .price {
  margin-top: 40px;
  color: white;
  font-weight: 800;
  font-size: 70px;
  text-shadow: 0px 0px 10px rgba(0, 0, 0, 0.42);
}
.containerSearch .card_inner__content .text {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 100;
  margin-top: 20px;
  font-size: 13px;
  line-height: 16px;
}
.containerSearch .card_inner__content .title {
  font-weight: 800;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.64);
  margin-top: 40px;
  font-size: 25px;
  letter-spacing: 1px;
}
.containerSearch .card_inner__cta {
  position: absolute;
  /* bottom: -80px; */
  left: 0;
  right: 0;
  margin: auto;
  width: 160px;
}
.containerSearch .card_inner__cta button {
  padding: 16px;
  box-shadow: 0px 0px 40px 4px #f76583,
    0px 0px 0px 2px rgba(255, 255, 255, 0.19) inset;
  width: 100%;
  background: -webkit-linear-gradient(-90deg, #fe5e7d 0%, #e5375b 100%);
  border: none;
  font-family: "Yanone Kaffeesatz", sans-serif;
  color: white;
  outline: none;
  font-size: 20px;
  border-radius: 6px;
  -webkit-transform: scale(0.94);
  transform: scale(0.94);
  cursor: pointer;
  transition: box-shadow 0.3s, -webkit-transform 0.3s 0.1s;
  transition: box-shadow 0.3s, transform 0.3s 0.1s;
  transition: box-shadow 0.3s, transform 0.3s 0.1s, -webkit-transform 0.3s 0.1s;
}
.containerSearch .card_inner__cta button span {
  text-shadow: 0px 4px 18px #ba3f57;
}
.containerSearch .card_inner__cta button:hover {
  box-shadow: 0px 0px 60px 8px #f76583,
    0px 0px 0px 2px rgba(255, 255, 255, 0.19) inset;
}

@-webkit-keyframes launch {
  0% {
    left: 1px;
  }
  25% {
    top: -50px;
    left: 1px;
  }
  50% {
    left: -100px;
  }
  75% {
    top: 100px;
    -webkit-transform: rotate(40deg);
    transform: rotate(40deg);
  }
  100% {
    left: 1px;
  }
}

@keyframes launch {
  0% {
    left: 1px;
  }
  25% {
    top: -50px;
    left: 1px;
  }
  50% {
    left: -100px;
  }
  75% {
    top: 100px;
    -webkit-transform: rotate(40deg);
    transform: rotate(40deg);
  }
  100% {
    left: 1px;
  }
}
@-webkit-keyframes fly {
  0% {
    left: 0px;
  }
  25% {
    top: -50px;
    left: 50px;
  }
  50% {
    left: -130px;
  }
  75% {
    top: 60px;
  }
  100% {
    left: 0px;
  }
}
@keyframes fly {
  0% {
    left: 0px;
  }
  25% {
    top: -50px;
    left: 50px;
  }
  50% {
    left: -130px;
  }
  75% {
    top: 60px;
  }
  100% {
    left: 0px;
  }
}
@-webkit-keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(720deg);
    transform: rotate(720deg);
  }
}
@keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(720deg);
    transform: rotate(720deg);
  }
}
@-webkit-keyframes intro {
  0% {
    -webkit-transform: scale(0);
    transform: scale(0);
  }
  25% {
    -webkit-transform: scale(1.06);
    transform: scale(1.06);
  }
  50% {
    -webkit-transform: scale(0.965);
    transform: scale(0.965);
  }
  75% {
    -webkit-transform: scale(1.02);
    transform: scale(1.02);
  }
  100% {
    -webkit-transform: scale(1);
    transform: scale(1);
  }
}
@keyframes intro {
  0% {
    -webkit-transform: scale(0);
    transform: scale(0);
  }
  25% {
    -webkit-transform: scale(1.06);
    transform: scale(1.06);
  }
  50% {
    -webkit-transform: scale(0.965);
    transform: scale(0.965);
  }
  75% {
    -webkit-transform: scale(1.02);
    transform: scale(1.02);
  }
  100% {
    -webkit-transform: scale(1);
    transform: scale(1);
  }
}
</style>

<style>
.play-button-container:hover {
  cursor: pointer;
  -webkit-transform: scale(0.96);
  transform: scale(0.96);
}

.play-button-container:hover .play-button {
  -webkit-transform: scale(1.16);
  transform: scale(1.16);
}

.play-button-container {
  width: 164px;
  height: 164px;
  border-radius: 100px;
  -webkit-border-radius: 100px;
  -moz-border-radius: 100px;
  display: -webkit-box;
  display: flex;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  background: -webkit-linear-gradient(
    330deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 100%
  );
  background: linear-gradient(
    120deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 100%
  );
  box-shadow: 0 24px 72px 0 rgba(0, 0, 0, 0.5);
  -webkit-transition: 300ms all cubic-bezier(0.4, 0, 0.2, 1);
  transition: 300ms all cubic-bezier(0.4, 0, 0.2, 1);
}

.play-button-container .play-button {
  z-index: 2;
  width: 120px;
  height: 120px;
  border-radius: 100%;
  background: #fff;
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.3);
  display: -webkit-box;
  display: flex;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  -webkit-transition: 300ms all cubic-bezier(0.4, 0, 0.2, 1);
  transition: 300ms all cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
