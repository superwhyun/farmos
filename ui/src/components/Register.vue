<template>
  <b-row>
    <b-col xxs="12">
      <b-row>
          <div style="width:50%">
            <p class="text-white h2">사용자 정보</p>
            <p class="white mb-0">
              관리자 아이디 - admin
              <br>초기 비밀번호 - 0000
            </p>
          </div>
          <div style="width:50%">
            <router-link tag="a" to="/">
              <span class="logo-single"/>
            </router-link>
            <h6 class="mb-4">비밀번호 변경</h6>
            <b-form @submit.prevent="formSubmit">
              <label class="form-group has-float-label mb-4">
                <input type="password" class="form-control" v-model="pre_pwd">
                <span>현재 비밀번호</span>
              </label>
              <label class="form-group has-float-label mb-4">
                <input type="password" class="form-control" v-model="new_pwd">
                <span>변경 비밀번호</span>
              </label>
              <label class="form-group has-float-label mb-4">
                <input type="password" class="form-control" v-model="new_pwd_chk">
                <span>변경 비밀번호 확인</span>
              </label>
              <div class="d-flex justify-content-end align-items-center">
                <b-button type="submit" variant="primary" size="lg" class="btn-shadow">변경</b-button>
              </div>
            </b-form>
          </div>
        </b-row>
    </b-col>
  </b-row>
</template>
<script>
export default {
  data () {
    return {
      pre_pwd: '',
      new_pwd: '',
      new_pwd_chk: ''
    }
  },
  methods: {
    formSubmit () {
      console.log('asdf')
      this.$emit('nextBtn')
    }
  }
}
</script>
