<template>
  <div class="col-xxs-12 mx-auto my-auto" style="padding:15px">
    <h4 class="c-grey-900 mB-30">룰 관리</h4>

    <RuleSelect ref="ruleDialog" :complateFn="ruleAddComplate"></RuleSelect>

    <b-row class="pl-4 pr-4">
      <b-col sm="6" lg="4" xl="3" class="mb-5">
        <el-card class="box-card new" shadow="hover" :body-style="{ padding: '0px'}">
          <div @click="goRuleDetail('new')" style="height:100%">
            <i class="el-icon-circle-plus"></i>
            <div class="el-upload__text">룰 추가</div>
          </div>
        </el-card>
      </b-col>
      <b-col sm="6" lg="4" xl="3" class="mb-5" v-for="(rule,index) in ruleList" :key="index">
        <el-card class="box-card" style="height: 220px;cursor: pointer;" shadow="hover">
          <div slot="header" class="clearfix" @click="goRuleDetail(rule.id)">
            <span>{{rule.name}}</span>
          </div>
          <div @click="goRuleDetail(rule.id)" class="w-100 h-100 p-15">
            <div>ID : {{rule.id}}</div>
            <div>Auto Applying : {{rule.autoapplying === 0 ? 'NO' : 'YES'}}</div>
          </div>
        </el-card>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import RuleSelect from '@/components/rule/select'
import { mapGetters } from 'vuex'
export default {
  components: {
    RuleSelect
  },
  computed: {
    ...mapGetters({
      getFields: 'field/getFields'
    })
  },
  mounted () {
    this.getRule()
  },
  data () {
    return {
      ruleList: []
    }
  },
  methods: {
    goRuleDetail (id) {
      this.$router.push(`/rule/${id}`)
    },
    ruleAddComplate () {
      this.getRule()
    },
    getField (id) {
      let name = ''
      for (const field of this.getFields) {
        if (field.id === id) {
          name = field.name
          break
        }
      }
      return name
    },
    async getRule () {
      try {
        const { data } = await this.axios.get('rule/template')
        this.ruleList = data
      } catch (error) {
        console.log(error)
      }
    }
  }
}
</script>

<style scoped>
div >>> .el-card__header {
  background-color: #f8f8f8;
}

div >>> .el-card__body {
  height: 100%;
}
</style>

<style  scoped>

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
