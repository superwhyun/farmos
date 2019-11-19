<template>
  <div class>
    <loading
      :active.sync="isLoading"
      :can-cancel="canCancel"
      :on-cancel="whenCancelled"
      :is-full-page="fullPage"
      :height="height"
      :width="width"
      :color="color"
      :loader="loader"
      :background-color="bgColor"
    >
      <div v-if="useSlot">
        <div id="loader"/>
        <h3 class="mt-5" style="text-align: center;" v-html="msg"/>
        <b-button class="mt-4" size="lg" block variant="danger" @click="searchCancel">취소</b-button>
      </div>
      <!-- <h3 v-if="useSlot">Loading ...</h3> -->
    </loading>
  </div>
</template>

<script>
import Loading from 'vue-loading-overlay'
import 'vue-loading-overlay/dist/vue-loading.css'
export default {
  props: ['msg'],
  data () {
    return {
      isLoading: false,
      fullPage: false,
      canCancel: false,
      useSlot: true,
      loader: 'spinner',
      color: '#007bff',
      bgColor: '#transparent',
      height: 128,
      width: 128,
      timeout: 3000 // ms
    }
  },
  components: {
    Loading
  },
  methods: {
    startLoading () {
      this.isLoading = true
    },
    stopLoading () {
      this.isLoading = false
    },
    searchCancel () {
      this.stopLoading()
      this.$emit('cancel')
    },
    whenCancelled () {
      console.log('User cancelled the loader.')
    }
  }
}
</script>

<style lang="scss" scoped>
.vld-overlay {
  position: fixed;
}
#loader {
  display: block;
  position: relative;
  left: 50%;
  top: 50%;
  width: 150px;
  height: 150px;
  margin: -75px 0 0 -75px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #3498db;
  background: transparent;

  -webkit-animation: spin 2s linear infinite; /* Chrome, Opera 15+, Safari 5+ */
  animation: spin 2s linear infinite; /* Chrome, Firefox 16+, IE 10+, Opera */
}

#loader:before {
  content: "";
  position: absolute;
  top: 5px;
  left: 5px;
  right: 5px;
  bottom: 5px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #e74c3c;

  -webkit-animation: spin 3s linear infinite; /* Chrome, Opera 15+, Safari 5+ */
  animation: spin 3s linear infinite; /* Chrome, Firefox 16+, IE 10+, Opera */
}

#loader:after {
  content: "";
  position: absolute;
  top: 15px;
  left: 15px;
  right: 15px;
  bottom: 15px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #f9c922;

  -webkit-animation: spin 1.5s linear infinite; /* Chrome, Opera 15+, Safari 5+ */
  animation: spin 1.5s linear infinite; /* Chrome, Firefox 16+, IE 10+, Opera */
}

@-webkit-keyframes spin {
  0% {
    -webkit-transform: rotate(0deg); /* Chrome, Opera 15+, Safari 3.1+ */
    -ms-transform: rotate(0deg); /* IE 9 */
    transform: rotate(0deg); /* Firefox 16+, IE 10+, Opera */
  }
  100% {
    -webkit-transform: rotate(360deg); /* Chrome, Opera 15+, Safari 3.1+ */
    -ms-transform: rotate(360deg); /* IE 9 */
    transform: rotate(360deg); /* Firefox 16+, IE 10+, Opera */
  }
}
@keyframes spin {
  0% {
    -webkit-transform: rotate(0deg); /* Chrome, Opera 15+, Safari 3.1+ */
    -ms-transform: rotate(0deg); /* IE 9 */
    transform: rotate(0deg); /* Firefox 16+, IE 10+, Opera */
  }
  100% {
    -webkit-transform: rotate(360deg); /* Chrome, Opera 15+, Safari 3.1+ */
    -ms-transform: rotate(360deg); /* IE 9 */
    transform: rotate(360deg); /* Firefox 16+, IE 10+, Opera */
  }
}
</style>
