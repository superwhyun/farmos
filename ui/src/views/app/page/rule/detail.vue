<template>
  <div class="col-xxs-12 mx-auto my-auto" style="padding:15px">
    <h4 class="c-grey-900 mB-30">{{id === 'new' ? '룰 추가' : '룰 수정'}}</h4>

    <div style="display: flex;">
      <div class="scollSideBar" style="position:fixed">
        <ul class="menu" v-scroll-spy-active="{class: 'customActive'}" v-scroll-spy-link>
          <li :key="item" v-for="item in titles" class="menu-item">
            <a>{{item}}</a>
          </li>
        </ul>
        <el-button type="primary" class="mt-5" @click="save">{{id === 'new' ? '룰 추가' : '룰 수정'}}</el-button>
        <el-button type="info" class="mt-3 ml-0" @click="del" v-if="id !== 'new'">룰 삭제</el-button>
      </div>

      <div class="main w-100" v-scroll-spy="{data: 'section',offset: 146}">
        <div>
          <el-card class="box-card mb-5" shadow="al" style="cursor: pointer;">
            <div slot="header" class="clearfix">{{titles[0]}}</div>
            <div>
              <div class="mt-2">룰 이름</div>
              <el-input class="mt-2" placeholder="룰 이름을 입력 하세요" v-model="rule.name">
                <template slot="prepend">이름</template>
              </el-input>
              <div class="mt-4">그룹</div>
              <el-input class="mt-2" placeholder="그룹 이름을 입력 하세요" v-model="rule.groupname">
                <template slot="prepend">그룹</template>
              </el-input>
              <div class="mt-5">온실 추가시 자동적용 유무</div>
              <el-radio-group v-model="rule.autoapplying" class="mt-3">
                <el-radio :label="0">미 적용</el-radio>
                <el-radio :label="1">적용</el-radio>
              </el-radio-group>
            </div>
          </el-card>
        </div>
        <div>
          <el-card
            class="box-card mb-5"
            shadow="al"
            style="cursor: pointer;"
            body-style="padding-top: 0px;padding-bottom: 0px;padding-right: 0px;padding-left: 0px;"
          >
            <div slot="header" class="clearfix">{{titles[1]}}</div>
            <jsonEditor ref="jsonEditor1" :json="rule.constraints" :options="jsonEditorOptions" />
          </el-card>
        </div>
        <div>
          <el-card
            class="box-card mb-5"
            shadow="al"
            style="cursor: pointer;"
            body-style="padding-top: 0px;padding-bottom: 0px;padding-right: 0px;padding-left: 0px;"
          >
            <div slot="header" class="clearfix">{{titles[2]}}</div>
            <jsonEditor ref="jsonEditor2" :json="rule.configurations" :options="jsonEditorOptions" />
          </el-card>
        </div>
        <div>
          <el-card
            class="box-card mb-5"
            shadow="al"
            style="cursor: pointer;"
            body-style="padding-top: 0px;padding-bottom: 0px;padding-right: 0px;padding-left: 0px;"
          >
            <div slot="header" class="clearfix">{{titles[3]}}</div>
            <jsonEditor ref="jsonEditor3" :json="rule.controllers" :options="jsonEditorOptions" />
          </el-card>
        </div>
        <div>
          <el-card
            class="box-card mb-5"
            shadow="al"
            style="cursor: pointer;"
            body-style="padding-top: 0px;padding-bottom: 0px;padding-right: 0px;padding-left: 0px;"
          >
            <div slot="header" class="clearfix">{{titles[4]}}</div>
            <jsonEditor ref="jsonEditor4" :json="rule.outputs" :options="jsonEditorOptions" />
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import JsonEditor from '@/components/JsonEditor'
import { mapGetters } from 'vuex'
export default {
  props: ['id'],
  components: {
    JsonEditor
  },
  data () {
    return {
      section: 0,
      titles: [
        '룰 기본정보',
        '제약 사항',
        '환경 설정',
        '동작 설정',
        '출력 결과'
      ],
      jsonEditorOptions: {
        mode: 'code'
      },
      rule: {
        name: '',
        groupname: '',
        autoapplying: 0,
        constraints: {},
        configurations: {},
        controllers: [],
        outputs: {}
      }
    }
  },
  computed: {
    ...mapGetters({
      getAllFieldDevices: 'device/getAllFieldDevices'
    })
  },
  methods: {
    async del () {
      this.$confirm('룰을 삭제 하시겠습니까?', '확인', {
        type: 'info'
      })
        .then(async _ => {
          try {
            await this.axios.delete(`/rule/template/${this.id}`)
            this.$notify({
              title: '성공',
              message: '룰 템플릿을 삭제 하였습니다.',
              type: 'success'
            })
            this.$router.replace(`/rule`)
          } catch (error) {
            this.$notify({
              title: '실패',
              message: '삭제에 실패 하였습니다',
              type: 'error'
            })
          }
        })
        .catch(_ => {})
    },
    async save () {
      let isError = false
      try {
        this.rule.constraints = this.$refs.jsonEditor1.editorJsonRetrun()
        this.rule.configurations = this.$refs.jsonEditor2.editorJsonRetrun()
        this.rule.controllers = this.$refs.jsonEditor3.editorJsonRetrun()
        this.rule.outputs = this.$refs.jsonEditor4.editorJsonRetrun()

        if (this.rule.name.replace(/(^\s*)|(\s*$)/g, '').length === 0) {
          this.$notify({
            title: '실패',
            message: '이름을 입력 해 주세요.',
            type: 'error'
          })
          return
        }
      } catch (error) {
        this.$notify({
          title: '실패',
          message: '데이터에 오류가 있습니다.',
          type: 'error'
        })
        isError = true
      }
      if (isError) {
        return
      }
      try {
        if (this.id !== 'new') {
          await this.axios.put(`/rule/template/${this.id}`, this.rule)
        } else {
          const { data } = await this.axios.post(`/rule/template`, this.rule)
          this.$router.replace(`/rule/${data.id}`)
        }
        this.$notify({
          title: '성공',
          message: '룰 템플릿을 저장 하였습니다.',
          type: 'success'
        })
      } catch (error) {
        this.$notify({
          title: '실패',
          message: '저장에 실패 하였습니다',
          type: 'error'
        })
      }
    },
    async getRuleTemplate () {
      try {
        const { data } = await this.axios.get(`/rule/template/${this.id}`)
        this.rule = data
      } catch (error) {
        console.log(error)
      }
    }
  },
  async mounted () {
    if (this.id !== 'new') {
      this.getRuleTemplate()
    }
  }
}
</script>

<style scoped>
div >>> .el-input-group__prepend {
  background-color: #fff;
}

div >>> .el-input__inner {
  padding-left: 8px;
  padding-right: 0px;
  /* text-align: center; */
}

div >>> .el-input__suffix {
  right: -2px;
}

.scollSideBar {
  /* top: 30px;
  left: 10px; */
  max-width: 150px;
  font-size: 18px;
}
.menu {
  padding: 0;
  list-style: none;
}
.current-section {
  padding-top: 50px;
}
.current-section input {
  max-width: 3em;
}
.menu-item {
  margin-bottom: 20px;
}
.menu-item a {
  cursor: pointer;
}
.main {
  margin-left: 180px;
}
.customActive {
  color: #178ce6;
  border-left: 1px solid #178ce6;
  padding-left: 5px;
  transition: all 0.5s;
}
</style>
