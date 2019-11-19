<template>
  <el-dialog title="작동규칙 추가" :visible.sync="ruleDialogVisible" width="40%">
    <h5>작동규칙 항목을 선택 하세요</h5>
    <el-table
      stripe
      @row-click="ruleSelect"
      :data="getRule"
      style="width: 100%"
      :default-sort="{prop: 'groupname', order: 'ascending'}"
    >
      <el-table-column prop="groupname" label="그룹" width="180" sortable align="center"></el-table-column>
      <el-table-column prop="name" label="이름" align="center"></el-table-column>
    </el-table>

    <!-- <el-row :gutter="20" class="mt-4">
      <template v-for="rule in getRule">
        <el-col :span="8" :key="rule.id">
          <el-card class="box-card" shadow="hover" style="cursor: pointer;">
            <div slot="header" class="clearfix p-15" @click="ruleSelect(rule)">
              <span>{{rule.name}}</span>
            </div>
            <div @click="ruleSelect(rule)" class="w-100 h-100 p-15">
              <div>그룹 : {{rule.groupname}}</div>
            </div>
          </el-card>
        </el-col>
      </template>
    </el-row> -->
    <el-dialog title="확인" :visible.sync="confirmDialogVisible" width="30%" append-to-body>
      <span>선택하신 룰을 추가 하시겠습니까?</span>

      <span slot="footer" class="dialog-footer">
        <el-button @click="confirmDialogVisible = false">취소</el-button>
        <el-button type="primary" @click="addRule">추가</el-button>
      </span>
    </el-dialog>
  </el-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  props: ['complateFn', 'fieldId'],
  data () {
    return {
      ruleList: [],
      selectRule: {},
      ruleDialogVisible: false,
      confirmDialogVisible: false
    }
  },
  computed: {
    ...mapGetters({
      getFields: 'field/getFields'
    }),
    getRule () {
      if (Number(this.fieldId) === 0) {
        return this.ruleList.filter(
          item => item.constraints.target === 'farm' && item.autoapplying === 0
        )
      } else {
        return this.ruleList.filter(
          item => item.constraints.target === 'field' && item.autoapplying === 0
        )
      }
    }
  },
  methods: {
    async addRule () {
      try {
        if (this.selectRule.constraints.data) {
          this.selectRule.constraints.data.forEach(element => {
            element.dataid = ''
          })
        }

        if (this.selectRule.constraints.devices) {
          this.selectRule.constraints.devices.forEach(element => {
            element.deviceid = ''
          })
        }

        const { data } = await this.axios.post('rule/applied', {
          rule: this.selectRule,
          fieldId: this.fieldId
        })
        this.$notify({
          title: '성공',
          message: '룰을 추가 하였습니다.',
          type: 'success'
        })

        this.selectRule = {}
        this.confirmDialogVisible = false
        this.ruleDialogVisible = false

        this.complateFn(data.id)
      } catch (error) {
        console.log(error)
      }
    },
    ruleSelect (rule) {
      console.log(rule)
      this.selectRule = this._.cloneDeep(rule)

      if (this.selectRule.constraints.target === 'farm') {
        this.selectField = 0
      }

      this.$confirm('선택하신 룰을 추가 하시겠습니까?', '확인', {
        type: 'info'
      })
        .then(async _ => {
          this.addRule()
        })
        .catch(_ => {})

      // this.confirmDialogVisible = true
    },
    showRuleDialog () {
      this.ruleDialogVisible = true
    },
    async getRuleTemplate () {
      try {
        const { data } = await this.axios.get('rule/template')
        this.ruleList = data
      } catch (error) {
        console.log(error)
      }
    }
  },
  mounted () {
    this.getRuleTemplate()
  }
}
</script>

<style lang="scss" scoped>
.el-col {
  margin-bottom: 20px;
}
</style>
