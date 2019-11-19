<template>
  <!-- #Left Sidebar ==================== -->
  <div class="sidebar">
    <div class="sidebar-inner">
      <!-- ### $Sidebar Header ### -->
      <div class="sidebar-logo">
        <div class="peers ai-c fxw-nw">
          <div class="peer peer-greed">
            <div class="peers ai-c fxw-nw">
              <div class="peer">
                <div class="logo">
                  <img src="@/assets/img/logo.png" alt />
                </div>
              </div>
              <div class="peer peer-greed">
                <h5 class="lh-1 mB-0 logo-text">farmos_UI</h5>
              </div>
            </div>
          </div>
          <div class="peer">
            <div class="mobile-toggle sidebar-toggle">
              <a href class="td-n">
                <i class="ti-arrow-circle-left"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- ### $Sidebar Menu ### -->
      <ul class="sidebar-menu scrollable" style="position: initial;">
        <router-link tag="li" class="nav-item mT-30 actived" :to="`/`">
          <a class="sidebar-link">
            <span class="icon-holder">
              <i class="c-blue-500 ti-home"></i>
            </span>
            <span class="title">메인</span>
          </a>
        </router-link>
        <router-link tag="li" class="nav-item actived" :to="`/dashboard`">
          <a class="sidebar-link">
            <span class="icon-holder">
              <i class="c-puple-500 ti-blackboard"></i>
            </span>
            <span class="title">대시보드</span>
          </a>
        </router-link>
        <router-link tag="li" class="nav-item" :to="`/monitor`">
          <a class="sidebar-link">
            <span class="icon-holder">
              <i class="c-green-500 ti-bar-chart"></i>
            </span>
            <span class="title">데이터 조회</span>
          </a>
        </router-link>

        <li class="nav-item dropdown">
          <a class="dropdown-toggle" href="javascript:void(0);">
            <span class="icon-holder">
              <i class="c-orange-500 ti-user"></i>
            </span>
            <span class="title">장비제어</span>
            <span class="arrow">
              <i class="ti-angle-right"></i>
            </span>
          </a>
          <ul class="dropdown-menu">
            <template v-for="field in getFields">
              <router-link
                tag="li"
                :to="`/control/manual/${field.id}`"
                :key="field.id"
                v-if="field.fieldtype === 'greenhouse'"
              >
                <a class="sidebar-link">{{ field.name }}</a>
              </router-link>
            </template>
            <router-link tag="li" :to="`/control/manual/nutrient-supply`">
              <a class="sidebar-link">양액기</a>
            </router-link>
          </ul>
        </li>
        <li class="nav-item dropdown">
          <a class="dropdown-toggle" href="javascript:void(0);">
            <span class="icon-holder">
              <i class="c-orange-500 ti-desktop"></i>
            </span>
            <span class="title">작동규칙</span>
            <span class="arrow">
              <i class="ti-angle-right"></i>
            </span>
          </a>
          <ul class="dropdown-menu">
            <router-link
              tag="li"
              :to="`/control/auto/${field.id}`"
              v-for="field in getFields"
              :key="field.id"
            >
              <a class="sidebar-link">{{ field.name }}</a>
            </router-link>
          </ul>
        </li>
        <li class="nav-item dropdown">
          <a class="dropdown-toggle" href="javascript:void(0);">
            <span class="icon-holder">
              <i class="c-gray-500 ti-settings"></i>
            </span>
            <span class="title">설정</span>
            <span class="arrow">
              <i class="ti-angle-right"></i>
            </span>
          </a>
          <ul class="dropdown-menu">
            <router-link tag="li" :to="`/farm`">
              <a class="sidebar-link">농장 정보</a>
            </router-link>
            <router-link tag="li" :to="`/place`">
              <a class="sidebar-link">구역 정보</a>
            </router-link>
            <router-link tag="li" :to="`/device/search`">
              <a class="sidebar-link">장비 검색</a>
            </router-link>
            <router-link tag="li" :to="`/device`">
              <a class="sidebar-link">장비 수정</a>
            </router-link>
            <router-link tag="li" :to="`/rule`">
              <a class="sidebar-link">룰 관리</a>
            </router-link>
            <router-link tag="li" :to="`/timespan`">
              <a class="sidebar-link">타임스팬 관리</a>
            </router-link>
          </ul>
        </li>
        <!-- <li class="nav-item dropdown">
          <a class="dropdown-toggle" href="javascript:void(0);">
            <span class="icon-holder">
              <i class="c-teal-500 ti-view-list-alt"></i>
            </span>
            <span class="title">Multiple Levels</span>
            <span class="arrow">
              <i class="ti-angle-right"></i>
            </span>
          </a>
          <ul class="dropdown-menu">
            <li class="nav-item dropdown">
              <a href="javascript:void(0);">
                <span>Menu Item</span>
              </a>
            </li>
            <li class="nav-item dropdown">
              <a href="javascript:void(0);">
                <span>Menu Item</span>
                <span class="arrow">
                  <i class="ti-angle-right"></i>
                </span>
              </a>
              <ul class="dropdown-menu">
                <li>
                  <a href="javascript:void(0);">Menu Item</a>
                </li>
                <li>
                  <a href="javascript:void(0);">Menu Item</a>
                </li>
              </ul>
            </li>
          </ul>
        </li>-->
      </ul>
      <div style="height: 50px;margin-top: -40px;text-align: center;">
        <router-link :to="`/opensource`">
          <a class="sidebar-link">Open Source Licenses</a>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  computed: {
    ...mapGetters({
      getFields: 'field/getFields'
    })
  },
  mounted () {
    import('@/assets/scripts/sidebar')
  }
}
</script>

<style lang="scss" scoped>
</style>
