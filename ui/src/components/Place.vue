<template>
  <div>
    <el-dialog
      title="온실 추가"
      :visible.sync="dialogVisible"
      width="40%"
      top="2vh"
      :before-close="()=>dialogVisible=false"
    >
      <div class="p-10">
        <h5 class="d-inline">온실 정보를 입력 하세요</h5>
        <el-form class="mt-4" label-position="left" label-width="100px">
          <el-form-item label="이름">
            <el-input v-model="newPlace.name" placeholder="온실 이름을 입력 하세요"></el-input>
          </el-form-item>
          <el-form-item label="온실 작물">
            <el-select
              v-model="newPlace.cropinfo.crop"
              placeholder="재배하는 작물을 선택 하세요"
              style="width:100%"
            >
              <el-option
                v-for="item in cropCode"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="재배일">
            <el-date-picker
              style="width:100%"
              v-model="newPlace.cropinfo.plantdate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="재배 시작일을 선택 하세요"
            ></el-date-picker>
          </el-form-item>
          <el-form-item label="주소">
            <MapSearch
              ref="mapNew"
              :lat="newPlace.latitude"
              :lng="newPlace.longitude"
              @mapResult="mapNewResult"
            />
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="newPlaceClear">취소</el-button>
        <el-button type="primary" @click="newPlaceSave">저장</el-button>
      </span>
    </el-dialog>

    <b-row class="pl-4 pr-4">
      <b-col sm="6" lg="4" xl="3" class="mb-5">
        <div class="new" @click="dialogVisible = true">
          <i class="el-icon-circle-plus"></i>
          <div class="el-upload__text">온실 추가</div>
        </div>
      </b-col>
      <b-col sm="6" lg="4" xl="3" class="mb-5" v-for="(item,index) in fields" :key="index">
        <b-card class no-body style="height: 320px;">
          <div class="position-absolute card-top-buttons">
            <el-popover
              placement="right"
              width="500"
              trigger="click"
              @after-enter="mapRelayout(index)"
            >
              <div class="p-10">
                <h5 class="d-inline">온실 정보 수정</h5>
                <el-form class="mt-4" label-position="left" label-width="100px">
                  <el-form-item label="이름">
                    <el-input v-model="item.name"></el-input>
                  </el-form-item>
                  <template v-if="item.fieldtype === 'greenhouse'">
                    <el-form-item label="온실 작물">
                      <el-select v-model="item.data.crop.value" placeholder="Select">
                        <el-option
                          v-for="item in cropCode"
                          :key="item.id"
                          :label="item.name"
                          :value="item.id"
                        ></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item label="재배일">
                      <el-date-picker
                        v-model="item.data.plantdate.value"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="Pick a day"
                      ></el-date-picker>
                    </el-form-item>
                  </template>
                  <el-form-item label="주소" v-if="item.data.lat">
                    <MapSearch
                      ref="map"
                      :index="index"
                      :lat="item.data.lat.value"
                      :lng="item.data.lng.value"
                      @mapResult="mapResult"
                    />
                  </el-form-item>
                </el-form>
                <el-button class="float-right mb-2 ml-4" @click="placeDelete(index)" type="primary">삭제</el-button>
                <el-button class="float-right mb-2" @click="placeModify(index)" type="primary">변경</el-button>
              </div>
              <el-button slot="reference" icon="el-icon-edit" circle></el-button>
            </el-popover>
          </div>
          <img
            :src="item.fieldtype === 'local' ? '/assets/img/local.jpg' : '/assets/img/greenhouse.jpg'"
            alt="Detail"
            class="card-img-top"
          />
          <b-badge variant="primary" pill class="position-absolute badge-top-left">{{item.tempMode}}</b-badge>
          <b-card-body>
            <p class="text-muted mb-0">이름</p>
            <div class="mb-2 ml-3">{{item.name ? item.name : '&nbsp;' }}</div>
            <p class="text-muted mb-0">작물</p>
            <div class="mb-2 ml-3">{{item.data.crop ? getCrop(item.data.crop.value) : '&nbsp;'}}</div>
            <p class="text-muted mb-0">재배일</p>
            <div class="mb-3 ml-3">{{item.data.plantdate ? item.data.plantdate.value : '&nbsp;'}}</div>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import { cropCode } from '@/constants/config'
import MapSearch from '@/components/MapSearch'
import { mapGetters, mapActions } from 'vuex'
export default {
  components: {
    MapSearch
  },
  computed: {
    ...mapGetters({
      getFields: 'field/getFields'
    })
  },
  watch: {
    getFields (n) {
      this.fields = this._.cloneDeep(n)
    }
  },
  mounted () {
    this.fetchDataField()
    // this.fields = this._.cloneDeep(this.getFields)
  },
  data () {
    return {
      dialogVisible: false,
      cropCode: cropCode,
      fields: [],
      selectData: [
        { label: '외부', value: 'local' },
        { label: '온실', value: 'greenhouse' }
      ],
      newPlace: {
        tempMode: 'new',
        address: '',
        name: '',
        fieldtype: 'greenhouse',
        latitude: 33.450701,
        longitude: 126.570667,
        cropinfo: {
          crop: '',
          plantdate: ''
        }
      }
    }
  },
  methods: {
    ...mapActions({
      fetchDataField: 'field/fetchDataField'
    }),
    mapNewResult (data) {
      this.newPlace.address = data.address
      this.newPlace.latitude = data.latlng.getLat()
      this.newPlace.longitude = data.latlng.getLng()
    },
    mapResult (data) {
      this.fields[data.index].address = data.address
      this.fields[data.index].data.lat.value = data.latlng.getLat()
      this.fields[data.index].data.lng.value = data.latlng.getLng()
    },
    mapRelayout (index) {
      this.$refs.map[index].mapRelayout()
    },
    getCrop (id) {
      let crop = this.cropCode.filter(item => item.id === id)
      if (crop[0] === undefined) {
        return ''
      }
      return crop[0].name
    },
    newPlaceClear () {
      this.dialogVisible = false
      this.newPlace = {
        tempMode: 'new',
        address: '',
        name: '',
        fieldtype: 'greenhouse',
        latitude: 33.450701,
        longitude: 126.570667,
        cropinfo: {
          crop: '',
          plantdate: ''
        }
      }
    },
    async newPlaceSave () {
      try {
        await this.axios.post('field', this.newPlace)
        this.newPlaceClear()
        try {
          this.$refs.mapNew.clear()
        } catch (error) {

        }
        this.$notify({
          title: '성공',
          message: '구역 정보 추가 하였습니다.',
          type: 'success'
        })
        this.fetchDataField()
      } catch (error) {
        console.log(error)
        this.$notify({
          title: '실패',
          message: '구역 정보 추가 실패 하였습니다.',
          type: 'error'
        })
      }
    },
    async placeDelete (index) {
      try {
        const item = this.fields[index]
        const { data } = await this.axios.delete(`field/${item.id}`, item)

        if (data) {
          this.$notify({
            title: '성공',
            message: '온실을 삭제 하였습니다.',
            type: 'success'
          })
          this.fetchDataField()
        } else {
          this.$notify({
            title: '실패',
            message: '온실에 장비가 설정 되어 있습니다. 장비를 제거 해 주세요',
            type: 'error'
          })
        }
      } catch (error) {
        this.$notify({
          title: '성공',
          message: '온실 삭제를 실패 하였습니다.',
          type: 'error'
        })
        console.log(error)
      }
    },
    async placeModify (index) {
      try {
        const item = this.fields[index]
        if (item.plantdate && item.plantdate.length > 0) {
          item.plantdate = this.$date().format(item.plantdate, 'YYYY-MM-DD')
        } else {
          delete item.plantdate
        }
        await this.axios.put(`field/${item.id}`, item)

        this.$notify({
          title: '성공',
          message: '구역 정보 수정 하였습니다.',
          type: 'success'
        })
        this.fetchDataField()
        this.$emit('nextBtn')
      } catch (error) {
        this.$notify({
          title: '실패',
          message: '온실 정보 수정 실패 하였습니다.',
          type: 'error'
        })
        console.log(error)
      }
    }
  }
}
</script>

<style  scoped>
.new {
  background-color: #fff;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  height: 320px;
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
  margin: 100px 0 16px;
  line-height: 50px;
}

.new .el-upload__text {
  color: #606266;
  font-size: 14px;
  text-align: center;
}
</style>
