<template>
  <div>
    <timeline
      ref="timeline"
      :items="getTimeLine"
      :options="options"
      @current-time-tick="timelineEvent('currentTimeTick')"
    ></timeline>
  </div>
</template>

<script>
import { Timeline } from 'vue2vis'
export default {
  props: ['history', 'currentState', 'type', 'roll'],
  watch: {
    'history.date' (newValue, oldValue) {
      this.$set(
        this.options,
        'min',
        this.$date().format(this.history.date, 'YYYY-MM-DD 00:00:00')
      )
      this.$set(
        this.options,
        'max',
        this.$date().format(this.history.date, 'YYYY-MM-DD 23:59:59')
      )
      this.$refs.timeline.zoomOut(1)
    }
  },
  data () {
    let min = this.$date().format(this.history.date, 'YYYY-MM-DD 00:00:00')
    let max = this.$date().format(this.history.date, 'YYYY-MM-DD 23:59:59')
    let now = this.$date().format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    return {
      isRoll: true,
      nowTime: now,
      options: {
        format: {
          majorLabels: {
            minute: 'YYYY-MM-DD'
          }
        },
        min: min,
        max: max,
        zoomMin: 1000 * 60 * 10, // one day in milliseconds
        zoomMax: 1000 * 60 * 60, // about three months in milliseconds
        editable: false,
        stack: true,
        height: '405px'
      },
      timeline: {
        items: [
          {
            start: new Date('2014-04-16 0:0:0'),
            end: new Date('2014-04-16 4:0:0'),
            type: 'background',
            title: 'Normal text111',
            content: '동작'
          },
          {
            start: new Date('2014-04-16 4:0:0'),
            end: new Date('2014-04-16 5:30:0'),
            type: 'background',
            className: 'negative'
          },
          {
            start: new Date('2014-04-16 5:30:0'),
            end: new Date('2014-04-16 12:30:0'),
            type: 'background',
            title: 'Normal text33',
            content: '동작'
          },
          {
            start: new Date('2014-04-16 12:30:0'),
            end: new Date('2014-04-16 24:0:0'),
            type: 'background',
            className: 'negative'
          },
          {
            content: '파라미터 관수 명령',
            start: new Date('2014-04-16 13:10:0'),
            title: '관수 명령'
          },
          {
            start: new Date('2014-04-16 12:2:0'),
            content: '1번 관수',
            type: 'point',
            title: '관수 명령'
          },
          {
            start: new Date('2014-04-16 12:10:0'),
            content: '2번 관수',
            type: 'point',
            title: '관수 명령'
          },
          {
            start: new Date('2014-04-16 12:10:0'),
            content: '3번 관수',
            type: 'point',
            title: '관수 명령'
          }
        ]
      }
    }
  },
  components: {
    Timeline
  },
  computed: {
    getTimeLine () {
      let items = []
      if (this.history) {
        if (this.history.states.length === 0) {
          if (
            this.currentState.nvalue === 201 ||
            this.currentState.nvalue === 202 ||
            this.currentState.nvalue === 203 ||
            this.currentState.nvalue === 301 ||
            this.currentState.nvalue === 302 ||
            this.currentState.nvalue === 303 ||
            this.currentState.nvalue === 304 ||
            this.currentState.nvalue === 305 ||
            this.currentState.nvalue === 306 ||
            this.currentState.nvalue === 401 ||
            this.currentState.nvalue === 402 ||
            this.currentState.nvalue === 403
          ) {
            let item = {
              start: this.$date().format(
                this.options.min,
                'YYYY-MM-DD 00:00:00'
              ),
              end: this.$date().parse(this.nowTime),
              type: 'background',
              content: this.getStatusCodeContent(this.currentState.nvalue),
              className: this.backgroundType(this.currentState.nvalue)
            }
            items.push(item)
          }
        } else {
          for (let index = 0; index < this.history.states.length; index++) {
            const element = this.history.states[index]
            if (
              element.nvalue === 201 ||
              element.nvalue === 202 ||
              element.nvalue === 203 ||
              element.nvalue === 301 ||
              element.nvalue === 302 ||
              element.nvalue === 303 ||
              element.nvalue === 304 ||
              element.nvalue === 305 ||
              element.nvalue === 306 ||
              element.nvalue === 401 ||
              element.nvalue === 402 ||
              element.nvalue === 403
            ) {
              let item = {
                start: this.$date().parse(
                  this.$date().format(element.obs_time, 'YYYY-MM-DD HH:mm:ss')
                ),
                end:
                  index < this.history.states.length - 1
                    ? this.$date().parse(
                      this.$date().format(
                        this.history.states[index + 1].obs_time,
                        'YYYY-MM-DD HH:mm:ss'
                      )
                    )
                    : this.$date().parse(this.nowTime),
                type: 'background',
                content: this.getStatusCodeContent(element.nvalue),
                className: this.backgroundType(element.nvalue)
              }
              items.push(item)
            }
          }
        }

        for (const request of this.history.requests) {
          items.push({
            start: this.$date().parse(
              this.$date().format(request.senttime, 'YYYY-MM-DD HH:mm:ss')
            ),
            content: this.getCmdCodeContent(request.command),
            title: this.getCmdCodeTitle(request)
          })
        }
      }
      return items
    }
  },
  mounted () {},
  methods: {
    backgroundType (type) {
      let value = ''
      switch (type) {
        case 201:
        case 202:
        case 203:
        case 301:
          value = 'open'
          break
        case 302:
          value = 'closed'
          break
        default:
          value = 'open'
          break
      }
      return value
    },
    reDraw () {
      this.$refs.timeline.redraw()
    },
    getStatusCodeContent (code) {
      if (this.type === 'switch') {
        switch (code) {
          case 0:
            return '중지'
          case 201:
            return '작동'
          case 202:
            return '시간작동'
          case 203:
            return '방향작동'
          case 301:
            return '열기'
          case 302:
            return '닫기'
          case 303:
            return '시간열기'
          case 304:
            return '시간닫기'
          case 305:
            return '위치이동'
          case 306:
            return '설정저장'
          case 401:
            return '준비중'
          case 402:
            return '양액 공급중'
          case 403:
            return '정지중'
        }
      }
    },
    getCmdCodeContent (code) {
      if (this.type === 'switch') {
        switch (code) {
          case 0:
            return '중지'
          case 201:
            return '작동'
          case 202:
            return '시간작동'
          case 203:
            return '방향작동'
          case 301:
            return '열기'
          case 302:
            return '닫기'
          case 303:
            return '시간열기'
          case 304:
            return '시간닫기'
          case 305:
            return '위치이동'
          case 306:
            return '설정저장'
          case 401:
            return '1회관수'
          case 402:
            return '파람관수'
          case 403:
            return '제어변경'
        }
      }
    },
    getCmdCodeTitle (request) {
      if (this.type === 'switch') {
        switch (request.command) {
          case 0:
            return (
              `명령 시간 : ${this.$date().format(
                request.senttime,
                'HH:mm:ss'
              )}<br>` +
              `작동 시간 : ${this.$date().format(
                request.exectime,
                'HH:mm:ss'
              )}<br>`
            )
          case 201:
            return (
              `명령 시간 : ${this.$date().format(
                request.senttime,
                'HH:mm:ss'
              )}<br>` +
              `작동 시간 : ${this.$date().format(
                request.exectime,
                'HH:mm:ss'
              )}<br>`
            )
          case 202:
            return (
              `명령 시간 : ${this.$date().format(
                request.senttime,
                'HH:mm:ss'
              )}<br>` +
              `작동 시간 : ${this.$date().format(
                request.exectime,
                'HH:mm:ss'
              )}<br><br>``옵션<br>` +
              `시간 : ${request.params['hold-time']}<br>`
            )
          case 203:
            return (
              `명령 시간 : ${this.$date().format(
                request.senttime,
                'HH:mm:ss'
              )}<br>` +
              `작동 시간 : ${this.$date().format(
                request.exectime,
                'HH:mm:ss'
              )}<br><br>``옵션<br>` +
              `시간 : ${request.params['hold-time']}<br>` +
              `방향 : ${request.params['ratio']}`
            )
          case 301:
            return (
              `명령 시간 : ${this.$date().format(
                request.senttime,
                'HH:mm:ss'
              )}<br>` +
              `작동 시간 : ${this.$date().format(
                request.exectime,
                'HH:mm:ss'
              )}<br>`
            )
          case 302:
            return (
              `명령 시간 : ${this.$date().format(
                request.senttime,
                'HH:mm:ss'
              )}<br>` +
              `작동 시간 : ${this.$date().format(
                request.exectime,
                'HH:mm:ss'
              )}<br>`
            )
          case 303:
            return (
              `명령 시간 : ${this.$date().format(
                request.senttime,
                'HH:mm:ss'
              )}<br>` +
              `작동 시간 : ${this.$date().format(
                request.exectime,
                'HH:mm:ss'
              )}<br><br>옵션<br>` +
              `time : ${request.params['time']}<br>`
            )
          case 304:
            return (
              `명령 시간 : ${this.$date().format(
                request.senttime,
                'HH:mm:ss'
              )}<br>` +
              `작동 시간 : ${this.$date().format(
                request.exectime,
                'HH:mm:ss'
              )}<br><br>옵션<br>` +
              `time : ${request.params['time']}<br>`
            )
          case 305:
            return (
              `명령 시간 : ${this.$date().format(
                request.senttime,
                'HH:mm:ss'
              )}<br>` +
              `작동 시간 : ${this.$date().format(
                request.exectime,
                'HH:mm:ss'
              )}<br><br>옵션<br>` +
              `position : ${request.params['position']}<br>`
            )
          case 306:
            return (
              `명령 시간 : ${this.$date().format(
                request.senttime,
                'HH:mm:ss'
              )}<br>` +
              `작동 시간 : ${this.$date().format(
                request.exectime,
                'HH:mm:ss'
              )}<br><br>옵션<br>` +
              `opentime : ${request.params['opentime']}<br>` +
              `closetime : ${request.params['closetime']}`
            )
          case 401:
            return (
              `명령 시간 : ${this.$date().format(
                request.senttime,
                'HH:mm:ss'
              )}<br>` +
              `작동 시간 : ${this.$date().format(
                request.exectime,
                'HH:mm:ss'
              )}<br>`
            )
          case 402:
            return (
              `명령 시간 : ${this.$date().format(
                request.senttime,
                'HH:mm:ss'
              )}<br>` +
              `작동 시간 : ${this.$date().format(
                request.exectime,
                'HH:mm:ss'
              )}<br><br>옵션<br>` +
              `EC : ${request.params['EC']}<br>` +
              `pH : ${request.params['pH']}<br>` +
              `on-sec : ${request.params['on-sec']}<br>` +
              `start-area : ${request.params['start-area']}<br>` +
              `stop-area : ${request.params['stop-area']}`
            )
          case 403:
            return (
              `명령 시간 : ${this.$date().format(
                request.senttime,
                'HH:mm:ss'
              )}<br>` +
              `작동 시간 : ${this.$date().format(
                request.exectime,
                'HH:mm:ss'
              )}<br><br>옵션<br>` +
              `시간 : ${request.params['hold-time']}<br>` +
              `방향 : ${request.params['ratio']}`
            )
        }
      }
    },
    timelineEvent (eventName) {
      if (this.nowTime.split(' ')[0] === this.options.min.split(' ')[0]) {
        this.nowTime = this.$date().format(new Date(), 'YYYY-MM-DD HH:mm:ss')
        if (this.roll) {
          this.$refs.timeline.moveTo(this.nowTime)
        }
      }
    }
  }
}
</script>

<style src="vue2vis/dist/vue2vis.css">
</style>

<style>
.vis-item.vis-background {
  opacity: 0.8;
  z-index: 0;
  background: linear-gradient(
    10deg,
    rgba(195, 255, 145, 0.2) 100px,
    rgba(241, 205, 237, 0.3) 300px
  );
}
.vis-item.vis-background.open {
  z-index: 0;
  background: linear-gradient(
    0deg,
    rgba(209, 209, 209, 0.3) 200px,
    rgba(0, 0, 255, 0.2) 270px
  );
}
.vis-item.vis-background.closed {
  z-index: 0;
  background: linear-gradient(
    0deg,
    rgba(0, 0, 255, 0.2) 200px,
    rgba(209, 209, 209, 0.3) 270px
  );
}

.vis-item.vis-background .vis-item-overflow {
  overflow: visible;
  font-size: 1.1rem;
  font-weight: 500;
  color: #000;
  opacity: 0.7;
}

.vis-item.vis-background:hover {
  opacity: 1;
  border: 4px dashed rgba(72, 52, 255, 0.445);
}
</style>
