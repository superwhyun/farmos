<template>
  <div class="col-xxs-12 mx-auto my-auto" style="padding:15px">
    <h4 class="c-grey-900 mB-30">{{id === 'new' ? '타임스팬 추가' : '타임스팬 수정'}}</h4>

    <div style="display: flex;">
      <div class="scollSideBar" style="position:fixed">
        <ul class="menu" v-scroll-spy-active="{class: 'customActive'}" v-scroll-spy-link>
          <li :key="item" v-for="item in titles" class="menu-item">
            <a>{{item}}</a>
          </li>
        </ul>
        <el-button type="primary" class="mt-5" @click="save">{{id === 'new' ? '타임스팬 추가' : '타임스팬 수정'}}</el-button>
        <el-button type="info" class="mt-3 ml-0" @click="del" v-if="id !== 'new'">타임스팬 삭제</el-button>
      </div>

      <div class="main w-100" v-scroll-spy="{data: 'section',offset: 146}">
        <div>
          <el-card class="box-card mb-5" shadow="al" style="cursor: pointer;">
            <div slot="header" class="clearfix">{{titles[0]}}</div>
            <div>
              <div class="mt-2">타임스팬 이름</div>
              <el-input class="mt-2" placeholder="타임스팬 이름을 입력 하세요" v-model="item.name">
                <template slot="prepend">이름</template>
              </el-input>
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
            <jsonEditor ref="jsonEditor1" :json="item.timespan" :options="jsonEditorOptions" />
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import JsonEditor from '@/components/JsonEditor'
export default {
  props: ['id'],
  components: {
    JsonEditor
  },
  data () {
    return {
      section: 0,
      titles: [
        '기본정보',
        '타임스팬'
      ],
      jsonEditorOptions: {
        mode: 'code'
      },
      item: {
        name: '',
        timespan: {}
      }
    }
  },
  methods: {
    async del () {
      this.$confirm('타임스팬을 템플릿을 삭제 하시겠습니까?', '확인', {
        type: 'info'
      })
        .then(async _ => {
          try {
            await this.axios.delete(`/rule/timespan/${this.id}`)
            this.$notify({
              title: '성공',
              message: '타임스팬 템플릿을 삭제 하였습니다.',
              type: 'success'
            })
            this.$router.replace(`/timespan`)
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
        this.item.timespan = this.$refs.jsonEditor1.editorJsonRetrun()

        if (this.item.name.replace(/(^\s*)|(\s*$)/g, '').length === 0) {
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
          await this.axios.put(`/rule/timespan/${this.id}`, this.item)
        } else {
          const { data } = await this.axios.post(`/rule/timespan`, this.item)
          this.$router.replace(`/timespan/${data.id}`)
        }
        this.$notify({
          title: '성공',
          message: '타임스팬 템플릿을 저장 하였습니다.',
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
    async getTimespanTemplate () {
      try {
        const { data } = await this.axios.get(`/rule/timespan/${this.id}/field/-1`)
        this.item = data
      } catch (error) {
        console.log(error)
      }
    }
  },
  async mounted () {
    if (this.id !== 'new') {
      this.getTimespanTemplate()
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
