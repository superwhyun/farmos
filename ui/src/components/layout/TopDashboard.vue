<template>
  <!-- ### $Topbar ### -->
  <div class="header navbar">
    <div class="header-container">
      <ul class="nav-left">
        <li>
          <a id="sidebar-toggle" class="sidebar-toggle" href="javascript:void(0);">
            <i class="ti-menu"></i>
          </a>
        </li>
      </ul>
      <ul class="nav-right">
        <li class="notifications dropdown">
          <router-link :to="'/'">
            <i class="ti-close"></i>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    tryLogout () {
      this.$store.commit('user/unsetCurrentUser')
      // this.$router.replace(`/login`)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
