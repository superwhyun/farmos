<template>
  <div class="p-10">
    <transition-group>
      <RuleSelect key="select" v-if="nowView === viewType.select" :ruleSelect="ruleSelect"></RuleSelect>
      <Constraints
        key="constraints"
        v-else-if="nowView === viewType.constraints"
        :rule="selectRule"
      ></Constraints>
    </transition-group>
    <!-- <span slot="footer" class="dialog-footer">
      <el-button>취소</el-button>
      <el-button type="primary">저장</el-button>
    </span>-->
  </div>
</template>

<script>
import RuleSelect from '@/components/rule/select'
import Constraints from '@/components/rule/constraints'
export default {
  components: { RuleSelect, Constraints },
  data () {
    let viewType = {
      select: 'select',
      constraints: 'constraints'
    }
    return {
      viewType: viewType,
      nowView: viewType.select,
      selectRule: {}
    }
  },
  methods: {
    clear () {
      this.selectRule = {}
      this.nowView = this.viewType.select
    },
    ruleSelect (rule) {
      this.selectRule = rule
      this.nowView = this.viewType.constraints
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
