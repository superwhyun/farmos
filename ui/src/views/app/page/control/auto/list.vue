<template>
  <div class="col-xxs-12 mx-auto my-auto" style="padding:15px">
    <h4 class="c-grey-900 mB-30">{{getField(id)}} 작동규칙 리스트</h4>

    <RuleSelect ref="ruleDialog" :complateFn="goRuleDetail" :fieldId="id"></RuleSelect>

    <b-row class>
      <b-col lg="12" class="mb-5">
        <el-card class="box-card" shadow="hover" :body-style="{ padding: '20px'}">
          <b-row>
            <b-col lg="4">
              <el-card class="box-card new" shadow="hover" :body-style="{ padding: '0px'}">
                <div @click="showRuleDialog" style="height:100%">
                  <i class="el-icon-circle-plus"></i>
                  <div class="el-upload__text">작동규칙 추가</div>
                </div>
              </el-card>
            </b-col>
            <b-col lg="8">
              <b-row class="mt-4">
                <b-col lg="4">
                  <div>
                    <font class="text-muted mb-0">필터</font>
                    <p class="pl-1">센싱 값을 조작하는데 도움이 되는 룰</p>
                  </div>
                </b-col>
                <b-col lg="8">
                  <div>
                    <font class="text-muted mb-0">기본지표</font>
                    <p class="pl-1">온실 기본 인자로 자동으로 추가되며, 사용자가 관리하지 않는 룰</p>
                  </div>
                </b-col>
                <b-col lg="4">
                  <div>
                    <font class="text-muted mb-0">구동기(창,스위치,양액기)제어</font>
                    <p class="pl-1">기본적인 구동기 제어 룰</p>
                  </div>
                </b-col>
                <b-col lg="8">
                  <div>
                    <font class="text-muted mb-0">주요지표</font>
                    <p class="pl-1">온실 내부의 주요한 인자를 확인할 수 있도록 하는 룰</p>
                  </div>
                </b-col>
                <b-col lg="4">
                  <div>
                    <font class="text-muted mb-0">사용자정의</font>
                    <p class="pl-1">사용자가 정의하는 룰</p>
                  </div>
                </b-col>
                <b-col lg="8">
                  <div>
                    <font class="text-muted mb-0">특수지표</font>
                    <p class="pl-1">특별한 의미를 갖는 값을 계산하기 위한 룰</p>
                  </div>
                </b-col>
              </b-row>
            </b-col>
          </b-row>
        </el-card>
      </b-col>
    </b-row>

    <b-row>
      <b-col lg="12" class="mb-5">
        <el-card class="box-card" shadow="hover" :body-style="{ padding: '0px'}">
          <el-table
            @row-click="(row)=>goRuleDetail(row.id)"
            :data="getRuleNonAuto"
            style="width: 100%"
            :default-sort="{prop: 'groupname', order: 'ascending'}"
          >
            <el-table-column prop="groupname" label="그룹" width="180" sortable align="center"></el-table-column>
            <el-table-column prop="name" label="이름" align="center"></el-table-column>
            <el-table-column label="사용여부" prop="used" sortable align="center">
              <template slot-scope="scope">
                <el-tag
                  effect="dark"
                  :type="scope.row.used === 0 ? 'info' : 'success'"
                >{{scope.row.used === 0 ? '중지중' : '사용중'}}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </b-col>
    </b-row>

    <!-- <b-row class="pl-4 pr-4">
      <b-col sm="6" lg="4" xl="3" class="mb-5" v-for="(rule,index) in getRuleNonAuto" :key="index">
        <el-card class="box-card" style="height: 220px;cursor: pointer;" shadow="hover">
          <div slot="header" class="p-15" @click="goRuleDetail(rule.id)">
            <span>{{rule.name}}</span>
          </div>
          <div @click="goRuleDetail(rule.id)" class="w-100 h-100 p-15">
            <div>사용여부 : {{rule.used === 0 ? '중지' : '사용'}}</div>
            <div>구역 : {{rule.field_id === 0 ? '농장' : getField(rule.field_id)}}</div>
            <div>그룹 : {{rule.groupname}}</div>
          </div>
        </el-card>
      </b-col>
    </b-row>-->
  </div>
</template>
<script>
import RuleSelect from '@/components/rule/select'
import { mapGetters } from 'vuex'
export default {
  props: ['id'],
  components: {
    RuleSelect
  },
  computed: {
    ...mapGetters({
      getFields: 'field/getFields'
    }),
    getRuleNonAuto () {
      let list = []
      for (const rule of this.ruleList) {
        if (rule.autoapplying === 0) {
          list.push(rule)
        }
      }
      return list
    }
  },
  mounted () {
    this.getRule(this.id)
  },
  data () {
    return {
      ruleList: []
    }
  },
  methods: {
    goRuleDetail (id) {
      this.$router.push(`/control/auto/${this.id}/detail/${id}`)
    },
    ruleAddComplate () {
      this.getRule(this.id)
    },
    getField (id) {
      let name = ''
      for (const field of this.getFields) {
        if (field.id === Number(id)) {
          name = field.name
          break
        }
      }
      return name
    },
    async getRule (id) {
      try {
        const { data } = await this.axios.get(`field/${id}/rule`)
        this.ruleList = data
      } catch (error) {
        console.log(error)
      }
    },
    showRuleDialog () {
      this.$refs.ruleDialog.showRuleDialog()
    }
  },
  beforeRouteUpdate (to, from, next) {
    console.log()
    this.getRule(to.params.id)
    next()
    // react to route changes...
    // don't forget to call next()
  }
}
</script>

<style  scoped>
div >>> .el-card__header {
  background-color: #f8f8f8;
  padding: 0px;
}
div >>> .el-card__body {
  padding: 0px;
  width: 100%;
  height: 100%;
}

.new {
  background-color: #fff;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  height: 220px;
  text-align: center;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
.new:hover {
  border-color: #409eff;
}

.new .el-icon-circle-plus {
  font-size: 67px;
  color: #c0c4cc;
  margin: 70px 0 16px;
  line-height: 50px;
}

.new .el-upload__text {
  color: #606266;
  font-size: 14px;
  text-align: center;
}
</style>
