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
            <div class="custom-tree-node" slot-scope="{ data }">
              <span>&nbsp;{{ data.name }}</span>
              <span v-if="data.deviceStatus === 'new'">
                <b-badge pill variant="info" style="height:20px">{{data.deviceStatus}}</b-badge>
              </span>
            </div>
          </el-tree>
        </div>
        <multipane-resizer />
        <div :style="{ flexGrow: 1 }" class="pane">
          <template v-if="showNode && showNode.spec.noSpec">
            <el-button @click="jsonCheck">저장</el-button>
            <b-row class="mt-2">
              <b-col lg="12">
                <b-card class="mb-2" no-body>
                  <b-card-body>
                    <b-row>
                      <b-col lg="3" class="ta-c">
                        <div class="d-inline-block">
                          <h5 class="d-inline">{{showNode.compcode}}</h5>
                          <span class="text-muted text-small d-block">Compcode</span>
                        </div>
                      </b-col>
                      <b-col lg="3" class="ta-c">
                        <div class="d-inline-block">
                          <h5 class="d-inline">{{showNode.devcode}}</h5>
                          <span class="text-muted text-small d-block">Devcode</span>
                        </div>
                      </b-col>
                      <b-col lg="3" class="ta-c">
                        <div class="d-inline-block">
                          <h5 class="d-inline">{{showNode.type}}</h5>
                          <span class="text-muted text-small d-block">Type</span>
                        </div>
                      </b-col>
                      <b-col lg="3" class="ta-c">
                        <div class="d-inline-block">
                          <h5 class="d-inline">{{showNode.devindex}}</h5>
                          <span class="text-muted text-small d-block">Devindex</span>
                        </div>
                      </b-col>
                    </b-row>
                  </b-card-body>
                </b-card>
              </b-col>
            </b-row>
            <jsonEditor
              ref="jsonEditor"
              :json="showNode.spec.newSpec"
              :options="jsonEditorOptions"
              :on-change="onChange"
            />
          </template>
          <template v-else-if="showNode && !showNode.spec.noSpec">
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
                      v-for="(commSpec,id) in showNode.spec.CommSpec"
                      :key="id"
                      style="padding-left:12px;padding-right: 0px;padding-top: 10px;padding-bottom: 0px;"
                    >
                      <b-card :header="id" no-body>
                        <b-card-body
                          style="padding-top: 10px;padding-right: 10px;padding-bottom: 10px;padding-left: 20px;"
                        >
                          <b-list-group flush>
                            <b-list-group-item
                              v-for="(type,id) in commSpec"
                              :key="id"
                              style="padding-left: 0px;padding-right: 0px;padding-top: 5px; padding-bottom: 10px;"
                            >
                              <div>
                                <div class="mb-2">{{id + ' : ' + type['starting-register']}}</div>
                                <b-badge
                                  v-for="item in type.items"
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
                <b-card class="mb-4" no-body>
                  <div
                    class="position-absolute card-top-buttons"
                    v-if="device.deviceStatus === 'new'"
                  >
                    <el-popover placement="right" width="300" trigger="click">
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
                          class="w-100"
                          @change="placeChange"
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

                      <!-- <div style="text-align: right; margin: 0">
                        <el-button size="mini" type="text" @click="visible2 = false">취소</el-button>
                        <el-button type="primary" size="mini" @click="visible2 = false">경</el-button>
                      </div>-->
                      <el-button slot="reference" icon="el-icon-edit" circle></el-button>
                    </el-popover>
                  </div>
                  <img
                    src="/assets/img/sensor.svg"
                    alt="Detail"
                    class="card-img-top pl-4 pr-4"
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
                      v-for="(type,id) in device.spec.CommSpec"
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
                              v-for="(item,id) in type"
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
import { commonSpecIp } from '@/constants/config'
import JsonEditor from '@/components/JsonEditor'
import { Multipane, MultipaneResizer } from 'vue-multipane'
import { mapGetters } from 'vuex'

export default {
  components: {
    Multipane,
    MultipaneResizer,
    JsonEditor
  },
  props: ['devices'],
  data: function () {
    return {
      showNode: undefined,
      deviceSpec: {},
      nodeList: [],
      legacyDeviceList: [],
      jsonEditorOptions: {
        mode: 'code'
      }
    }
  },
  async mounted () {
    await this.getNodeIdDeviceList()
    await this.nodeTreeCreate()
  },
  computed: {
    ...mapGetters({
      getFields: 'field/getFields',
      getCvtgate: 'cvtgate/getCvtgate'
    })
  },
  methods: {
    getField (id) {
      for (const field of this.getFields) {
        if (field.id === id) return field
      }
    },
    async getNodeIdDeviceList () {
      const { data } = await this.axios.get(`device`)
      this.legacyDeviceList = data
    },
    async deviceItemCreate (
      coupleId,
      gatewayId,
      nodeId,
      node,
      spec,
      i,
      children,
      isDevices
    ) {
      if (!isDevices && !node.devcodes[i] && node.devcodes[i] === 0) {
        return
      }

      let devcode = 0
      if (isDevices) {
        devcode = i + 1
      } else {
        devcode = node.devcodes[i]
      }

      let tempSpec = this._.cloneDeep(spec)

      let deviceStatus = 'new'
      let name = tempSpec.Name ? tempSpec.Name : tempSpec.Type
      let place = []

      for (const legacyDevice of this.legacyDeviceList) {
        if (
          legacyDevice.coupleid === coupleId &&
          legacyDevice.gateid === gatewayId &&
          legacyDevice.nodeid === Number(nodeId)
        ) {
          if (
            legacyDevice.compcode === node.compcode &&
            legacyDevice.devcode === devcode &&
            legacyDevice.devindex === i
          ) {
            deviceStatus = 'legacy'
            name = legacyDevice.name
            place = legacyDevice.place
            break
          }
        }
      }

      let isDisabled = deviceStatus === 'legacy'
      if (spec.noSpec) {
        name = '미지원 스펙'
        isDisabled = true
      }

      children.push({
        name: name,
        place: place,
        nodeid: nodeId,
        compcode: node.compcode,
        devcode: devcode,
        devindex: i,
        spec: tempSpec,
        coupleid: coupleId,
        gateid: gatewayId,
        deviceStatus: deviceStatus,
        disabled: isDisabled
      })
    },
    async nodeTreeCreate () {
      try {
        this.nodeList = []
        let noSpectItems = []
        let gateList = []
        for (const id in this.devices) {
          if (id !== 'code' && id !== 'opid' && id !== 'time') {
            const temp = {}
            temp.gatewayId = id
            temp.node = this._.cloneDeep(this.devices[id])
            gateList.push(temp)
          }
        }

        let specCodeList = new Set([])
        gateList.forEach(gate => {
          for (const nodeId in gate.node) {
            specCodeList.add(
              `${gate.node[nodeId].compcode}/${gate.node[nodeId].nodecode}`
            )
          }
        })

        let searchCodePrmise = []
        for (let item of specCodeList) {
          searchCodePrmise.push(
            this.getDevSpec(item.split('/')[0], item.split('/')[1], 'nd')
          )
        }

        let results = []
        await Promise.all(
          searchCodePrmise.map(p =>
            p
              .then(p => {
                results.push(p)
                return p
              })
              .catch(p => {
                results.push(p)
              })
          )
        )

        results.map(result => {
          if (result.status === 200) {
            this.$set(
              this.deviceSpec,
              `${result.config.params.compcode}/${result.config.params.code}`,
              result.data
            )
          } else {
            this.$set(
              this.deviceSpec,
              `${result.config.params.compcode}/${result.config.params.code}`,
              { noSpec: true, newSpec: {} }
            )
          }
        })

        specCodeList = new Set([])
        gateList.forEach(gate => {
          for (const nodeId in gate.node) {
            const node = gate.node[nodeId]
            if (
              this.deviceSpec[`${node.compcode}/${node.nodecode}`] &&
              !this.deviceSpec[`${node.compcode}/${node.nodecode}`].noSpec &&
              !this.deviceSpec[`${node.compcode}/${node.nodecode}`].Devices &&
              node.devcodes
            ) {
              for (let devcode of node.devcodes) {
                specCodeList.add(`${node.compcode}/${devcode}`)
              }
            }
          }
        })

        searchCodePrmise = []
        for (let item of specCodeList) {
          searchCodePrmise.push(
            this.getDevSpec(item.split('/')[0], item.split('/')[1], 'dev')
          )
        }

        await Promise.all(
          searchCodePrmise.map(p =>
            p
              .then(p => {
                results.push(p)
                return p
              })
              .catch(p => {
                results.push(p)
              })
          )
        )

        results.map(result => {
          if (result.status === 200) {
            this.$set(
              this.deviceSpec,
              `${result.config.params.compcode}/${result.config.params.code}`,
              result.data
            )
          } else {
            this.$set(
              this.deviceSpec,
              `${result.config.params.compcode}/${result.config.params.code}`,
              { noSpec: true, newSpec: {} }
            )
          }
        })

        gateList.forEach(gate => {
          for (const nodeId in gate.node) {
            const node = gate.node[nodeId]
            let item = this.deviceSpec[`${node.compcode}/${node.nodecode}`]

            if (item) {
              let deviceStatus = 'new'
              let name = item.Name ? item.Name : item.Type

              for (const legacyDevice of this.legacyDeviceList) {
                if (
                  legacyDevice.coupleid === this.getCvtgate.couple &&
                  legacyDevice.gateid === gate.gatewayId &&
                  legacyDevice.nodeid === Number(nodeId)
                ) {
                  if (
                    legacyDevice.compcode === node.compcode &&
                    legacyDevice.devcode === node.nodecode
                  ) {
                    deviceStatus = 'legacy'
                    name = legacyDevice.name
                  } else {
                    deviceStatus = 'new'
                  }
                  break
                }
              }

              let isDisabled = deviceStatus === 'legacy'
              if (item.noSpec) {
                name = '미지원 스펙'
                isDisabled = true
              }

              let nodeTemp = {
                nodeid: Number(nodeId),
                compcode: node.compcode,
                devcode: node.nodecode,
                name: name,
                spec: item,
                coupleid: this.getCvtgate.couple,
                gateid: gate.gatewayId,
                deviceStatus: deviceStatus,
                disabled: isDisabled,
                children: []
              }

              if (!item.noSpec) {
                if (item.Devices) {
                  for (const [i, spec] of item.Devices.entries()) {
                    this.deviceItemCreate(
                      this.getCvtgate.couple,
                      gate.gatewayId,
                      nodeId,
                      node,
                      spec,
                      i,
                      nodeTemp.children,
                      true
                    )
                  }
                } else {
                  for (const [i, deviceCode] of node.devcodes.entries()) {
                    this.deviceItemCreate(
                      this.getCvtgate.couple,
                      gate.gatewayId,
                      nodeId,
                      node,
                      this.deviceSpec[`${node.compcode}/${deviceCode}`],
                      i,
                      nodeTemp.children,
                      false
                    )
                  }
                }
              }
              this.nodeList.push(nodeTemp)
            }
          }
        })

        this.nodeList = this.nodeList.concat(noSpectItems)
      } catch (error) {
        console.log(error)
      }
    },
    getCheckNode () {
      const device = this.$refs.tree
        .getHalfCheckedNodes()
        .concat(this.$refs.tree.getCheckedNodes())
      return this._.cloneDeep(device)
    },
    getDevSpec (compcode, devcode, type) {
      let specIP = commonSpecIp

      return this.axios.get(specIP, {
        params: {
          compcode: compcode,
          code: devcode,
          devtype: type
        }
      })
    },
    selectNode (data, node) {
      if (data.spec.noSpec) {
        this.showNode = data
        if (node.level === 1) {
          this.showNode.type = 'nd'
        } else {
          this.showNode.type = 'dev'
        }
      } else {
        if (node.level > 1) {
          this.showNode = node.parent.data
        } else {
          this.showNode = data
        }
      }
    },
    placeChange () {
      let isNutrientSupply = false
      let place = []
      for (const device of this.showNode.children) {
        if (device.spec.Class === 'nutrient-supply') {
          isNutrientSupply = true
          place = device.place
        }

        if (isNutrientSupply) {
          for (const device of this.showNode.children) {
            device.place = place
          }
        }
      }
    },
    jsonCheck () {
      this.$refs.jsonEditor.editorJsonGet()
    },
    async onChange (isSuccess, newJson) {
      if (isSuccess) {
        try {
          await this.axios.put(
            `${commonSpecIp}/?compcode=${this.showNode.compcode}&code=${this.showNode.devcode}&devtype=${this.showNode.type}`,
            newJson
          )
        } catch (error) {
          console.log(error)
        }
        this.$message({
          message: '스펙을 추가 하였습니다.'
        })
        await this.getNodeIdDeviceList()
        await this.nodeTreeCreate()
      } else {
        this.$message({
          type: 'error',
          message: 'Json 데이터를 확인해 주세요'
        })
      }
    }
  }
}
</script>

<style  scoped>
.vertical-panes {
  margin: 0px;
  width: 100%;
  min-height: 400px;
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
