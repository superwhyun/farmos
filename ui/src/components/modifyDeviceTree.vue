<template>
  <div>
    <div>
      <multipane class="vertical-panes" layout="vertical">
        <div
          :style="{ width: '250px',padding:'3px', minWidth: '250px', background: '#fff' }"
          class="pane"
        >
          <el-tree
            ref="tree"
            :data="nodeList"
            show-checkbox
            default-expand-all
            :expand-on-click-node="false"
            :highlight-current="true"
            :accordion="false"
            @current-change="selectNode"
          >
            <div class="custom-tree-node" slot-scope="{ data,node }">
              <span
                v-if="node.level === 1"
              >&nbsp;{{ getCvtgate.couple === data.id ? '지원 장비' :'수동 장비' }}</span>
              <span v-else>&nbsp;{{ data.name }}</span>
            </div>
          </el-tree>
        </div>
        <multipane-resizer />
        <div :style="{ flexGrow: 1 }" class="pane">
          <template v-if="showNode && showNode.nodeid">
            <b-row>
              <b-col lg="12">
                <b-card class="mb-3" no-body>
                  <b-card-body>
                    <div class="float-left float-none-xs mb-4">
                      <div class="d-inline-block">
                        <h5 class="d-inline">{{showNode.spec.Type}}</h5>
                        <span class="text-muted text-small d-block">Type</span>
                      </div>
                    </div>
                    <table class="table table-borderless" style="margin-bottom: 0px;">
                      <thead>
                        <tr>
                          <th
                            class="text-muted text-extra-small"
                            style="padding-bottom: 0px;padding-top: 0px;"
                          >CLASS</th>
                          <th
                            class="text-center text-muted text-extra-small"
                            style="padding-bottom: 0px;padding-top: 0px;"
                          >MODEL</th>
                          <th
                            class="text-right text-muted text-extra-small"
                            style="padding-bottom: 0px;padding-top: 0px;"
                          >NAME</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="padding-top: 6px;">
                            <h5>{{showNode.spec.Class}}</h5>
                          </td>
                          <td class="text-center" style="padding-top: 6px;">
                            <h5>{{showNode.spec.Model}}</h5>
                          </td>
                          <td class="text-right" style="padding-top: 6px;">
                            <h5>{{showNode.spec.Name}}</h5>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div
                      class="text-muted mt-1"
                      style="padding-bottom: 0px;padding-top: 0px;padding-left:12px"
                    >CommSpec</div>
                    <div
                      v-for="(item,id) in showNode.spec.CommSpec"
                      :key="id"
                      style="padding-left:12px;padding-right: 0px;padding-top: 10px;padding-bottom: 0px;"
                    >
                      <b-card :header="id" no-body>
                        <b-card-body
                          style="padding-top: 10px;padding-right: 10px;padding-bottom: 10px;padding-left: 20px;"
                        >
                          <b-list-group flush>
                            <b-list-group-item
                              v-for="(item,id) in item"
                              :key="id"
                              style="padding-left: 0px;padding-right: 0px;padding-top: 5px; padding-bottom: 10px;"
                            >
                              <div>
                                <div class="mb-2">{{id + ' : ' + item['starting-register']}}</div>
                                <b-badge
                                  v-for="item in item.items"
                                  :key="item"
                                  pill
                                  variant="outline-secondary"
                                  class="mb-1 mr-1"
                                >{{item}}</b-badge>
                              </div>
                            </b-list-group-item>
                          </b-list-group>
                        </b-card-body>
                      </b-card>
                    </div>
                  </b-card-body>
                </b-card>
              </b-col>
            </b-row>
            <b-row>
              <b-col lg="3" v-for="(device,index) in showNode.children" :key="index">
                <b-card no-body>
                  <div class="position-absolute card-top-buttons">
                    <el-popover placement="right" width="300" v-model="device.visible">
                      <p>정보를 입력 하세요!</p>
                      <el-input placeholder="이름을 입력 하세요" class="mb-2" v-model="device.name">
                        <template slot="prepend">이름</template>
                      </el-input>

                      <template
                        v-if="showNode.spec.Type === 'nutrient-supply-node'? device.spec.Class === 'nutrient-supply' ? true : false : true"
                      >
                        <div class="mt-2 mb-1">온실</div>
                        <el-select
                          v-model="device.place"
                          multiple
                          placeholder="온실을 선택 하세요"
                          class="mb w-100"
                        >
                          <el-option
                            v-for="item in getFields"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                          ></el-option>
                        </el-select>
                        <div
                          style="color:#1e90ff"
                          class="mt-2 mb-3"
                          v-if="showNode.spec.Type === 'nutrient-supply-node'"
                        >* 양액기 설치 온실 순서로 선택</div>
                        <div else class="mb-3"></div>
                      </template>
                      <el-button
                        class="w-100"
                        @click="deviceSave(device,showNode.spec.Type === 'nutrient-supply-node')"
                      >저장</el-button>
                      <el-button slot="reference" icon="el-icon-edit" circle></el-button>
                    </el-popover>
                  </div>
                  <img
                    src="/assets/img/sensor.svg"
                    alt="Detail"
                    class="card-img-top pl-5 pr-5"
                    :style="{opacity : device.deviceStatus === 'legacy' ? '0.3' : '1'}"
                  />
                  <b-badge
                    variant="primary"
                    pill
                    class="position-absolute badge-top-left"
                  >{{`이름 : ${ device.name ? device.name : '-' }`}}</b-badge>
                  <b-badge
                    variant="secondary"
                    pill
                    class="position-absolute badge-top-left-2"
                    v-if="showNode.spec.Type === 'nutrient-supply-node'? device.spec.Class === 'nutrient-supply' ? true : false : true"
                  >
                    온실 : {{device.place.length == 0 ? '-' : ''}}
                    <template
                      v-for="(place,idx) in device.place"
                    >{{idx>0 ? ', ' :'' }}{{getField(place).name}}</template>
                  </b-badge>
                  <b-card-body
                    :style="{background : device.deviceStatus === 'legacy' ? 'lightgray' : ''}"
                  >
                    <p class="text-muted text-small mb-2">Class</p>
                    <p class="mb-3">{{device.spec.Class}}</p>
                    <p class="text-muted text-small mb-2">Type</p>
                    <div class="mb-3">{{device.spec.Type}}</div>
                    <p class="text-muted text-small mb-2">Name</p>
                    <div class="mb-3">{{device.spec.Name ? device.spec.Name : '-'}}</div>
                    <p class="text-muted text-small mb-2">Model</p>
                    <div class="mb-3">{{device.spec.Model ? device.spec.Model : '-'}}</div>
                    <p class="text-muted text-small mb-2">Unit</p>
                    <div class="mb-3">{{device.spec.ValueUnit ? device.spec.ValueUnit : '-'}}</div>
                    <p class="text-muted text-small mb-2">SignificantDigit</p>
                    <div
                      class="mb-3"
                    >{{device.spec.SignificantDigit ? device.spec.SignificantDigit : '-'}}</div>
                    <p class="text-muted text-small mb-2">ValueType</p>
                    <div class="mb-3">{{device.spec.ValueType ? device.spec.ValueType : '-'}}</div>
                    <p class="text-muted text-small mb-2">Channel</p>
                    <div class="mb-3">{{device.spec.Channel ? device.spec.Channel : '-'}}</div>
                    <p class="text-muted text-small mb-2">CommSpec</p>
                    <div
                      v-for="(item,id) in device.spec.CommSpec"
                      :key="id"
                      style="padding-left: 0px;padding-right: 0px;padding-top: 10px;padding-bottom: 0px;"
                    >
                      <b-card
                        :header="id"
                        no-body
                        :style="{background : device.deviceStatus === 'legacy' ? 'lightgray' : ''}"
                      >
                        <b-card-body
                          style="padding-top: 10px;padding-right: 10px;padding-bottom: 10px;padding-left: 20px;"
                        >
                          <b-list-group flush>
                            <b-list-group-item
                              v-for="(item,id) in item"
                              :key="id"
                              style="padding-left: 0px;padding-right: 0px;padding-top: 10px; padding-bottom: 10px;"
                              :style="{background : device.deviceStatus === 'legacy' ? 'lightgray' : ''}"
                            >
                              <div>
                                <div class="mb-2">{{id + ' : ' + item['starting-register']}}</div>
                                <b-badge
                                  v-for="item in item.items"
                                  :key="item"
                                  pill
                                  variant="outline-secondary"
                                  class="mb-1 mr-1"
                                >{{item}}</b-badge>
                              </div>
                            </b-list-group-item>
                          </b-list-group>
                        </b-card-body>
                      </b-card>
                    </div>
                  </b-card-body>
                </b-card>
              </b-col>
            </b-row>
          </template>
        </div>
      </multipane>
    </div>
  </div>
</template>

<script>
import { Multipane, MultipaneResizer } from 'vue-multipane'
import { mapGetters } from 'vuex'

export default {
  components: {
    Multipane,
    MultipaneResizer
  },
  props: ['devices'],
  data: function () {
    return {
      showNode: undefined,
      deviceSpec: {},
      nodeList: [],
      nodeIdDeviceList: []
    }
  },
  async mounted () {
    await this.getDevices()
  },
  computed: {
    ...mapGetters({
      getFields: 'field/getFields',
      getCvtgate: 'cvtgate/getCvtgate',
      getDeviceList: 'device/getDevices'
    })
  },
  methods: {
    getCheckNode () {
      const device = this.$refs.tree.getCheckedNodes()
      return this._.cloneDeep(device)
    },
    async deviceSave (item, isNutrientSupply) {
      let modifyList = []
      if (isNutrientSupply) {
        if (item.spec.Class === 'nutrient-supply') {
          let place = []
          for (const device of this.showNode.children) {
            if (device.spec.Class === 'nutrient-supply') {
              place = device.place
              break
            }
          }

          for (const device of this.showNode.children) {
            device.place = place
            modifyList.push(device)
          }
        } else {
          modifyList.push(item)
        }
      } else {
        modifyList.push(item)
      }

      try {
        await this.axios.put('device', modifyList)
        this.$notify({
          title: '성공',
          message: '장비 정보를 수정 하였습니다.',
          type: 'success'
        })
        this.$store.dispatch('device/fetchDataDevice')
        item.visible = false
      } catch (error) {
        this.$notify({
          title: '실패',
          message: '장비 정보 수정 실패 하였습니다.',
          type: 'error'
        })
      }
    },
    async getDevices (isSelect) {
      try {
        const { data } = await this.axios.get('device')

        let couple = {}

        data.map(device => {
          let hasCouple = couple.hasOwnProperty(device.coupleid)
          if (!hasCouple) {
            couple[device.coupleid] = {}
          }
          let hasGate = couple[device.coupleid].hasOwnProperty(device.gateid)
          if (!hasGate) {
            couple[device.coupleid][device.gateid] = {}
          }
          let hasNode = couple[device.coupleid][device.gateid].hasOwnProperty(
            device.nodeid
          )
          if (!hasNode) {
            couple[device.coupleid][device.gateid][device.nodeid] = {}
          }
          if (device.devindex !== null) {
            couple[device.coupleid][device.gateid][device.nodeid].children.push(
              device
            )
          } else {
            couple[device.coupleid][device.gateid][device.nodeid] = {
              ...device,
              children: []
            }
          }
        })

        const temp = Object.keys(couple).map(coupleKey => {
          let tempCouple = {
            id: coupleKey,
            children: []
          }
          Object.keys(couple[coupleKey]).map(gateKey => {
            let tempNode = Object.keys(couple[coupleKey][gateKey]).map(
              nodeKey => {
                return couple[coupleKey][gateKey][nodeKey]
              }
            )
            tempCouple.children.push(...tempNode)
          })
          return tempCouple
        })

        this.nodeList = temp

        if (this.showNode !== undefined && isSelect) {
          for (const node of this.nodeList) {
            if (node.id === this.showNode.coupleid) {
              for (const children of node.children) {
                if (children.nid === this.showNode.nid) {
                  this.showNode = children
                  for (const node of this.showNode.children) {
                    this.$set(node, 'visible', false)
                  }
                  break
                }
              }
              break
            }
          }
        }
      } catch (error) {
        console.log(error)
      }
    },
    getField (id) {
      for (const field of this.getFields) {
        if (field.id === id) return field
      }
    },
    selectNode (data, node) {
      if (node.level > 2) {
        this.showNode = node.parent.data
      } else {
        this.showNode = data
      }
      for (const node of this.showNode.children) {
        this.$set(node, 'visible', false)
      }
    }
  }
}
</script>

<style  scoped>
.vertical-panes {
  margin: 0px;
  width: 100%;
  /* min-height: 400px; */
  height: 95%;
  border: 1px solid #ccc;
}
.vertical-panes > .pane {
  text-align: left;
  padding: 15px;
  overflow: auto;
  background: #eee;
}
.vertical-panes > .pane ~ .pane {
  border-left: 1px solid #ccc;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 20px;
}

div >>> .el-checkbox {
  margin-bottom: 0px;
}
</style>
