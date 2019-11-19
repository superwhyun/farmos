<template>
  <g>
    <template v-for="(item,index) in parameters.data">
      <circle
        v-if="item.isDot"
        :name="parameters.name"
        :x="item.x"
        :y="item.y"
        :class="classObject(item)"
        :key="index"
        :cx="x(item.x)"
        :cy="y(item.y)"
        r="6"
      />
    </template>
  </g>
</template>
<script>
export default {
  props: {
    xScale: {
      required: false,
      type: Function,
      default: Function
    },
    yScale: {
      required: false,
      type: Function,
      default: Function
    },
    parameters: {
      required: false,
      type: Object,
      default: Object
    },
    xScaleFunction: {
      type: Function,
      default: function name (params) {
        return params
      }
    }
  },
  methods: {
    classObject (item) {
      if (item.bulletStyle === undefined) {
        return 'dot'
      } else {
        return item.bulletStyle
      }
    },
    x (x) {
      return this.xScale(this.xScaleFunction(x))
    },
    y (y) {
      return this.yScale(y)
    }
  }
}
</script>

<style scoped>
.dot {
  fill: rgb(51, 156, 255);
  stroke: rgb(255, 255, 255);
  stroke-width: 2px;
  transition: all 1s;
}

.dot:hover {
  fill: orange;
}

.dot.active {
  fill: orange;
}

@-webkit-keyframes moving-dashes {
  100% {
    stroke-dashoffset: -31px;
  }
}

@keyframes moving-dashes {
  100% {
    stroke-dashoffset: -31px;
  }
}

.lastBullet {
  stroke-width: 2px;
  fill: red;
  stroke: red;
  transition: all 1s;
  -webkit-animation: pulsating 1s ease-out infinite;
  animation: pulsating 1s ease-out infinite;
}

@-webkit-keyframes pulsating {
  0% {
    stroke-opacity: 1;
    stroke-width: 0;
  }

  100% {
    stroke-opacity: 0;
    stroke-width: 30px;
  }
}

@keyframes pulsating {
  0% {
    stroke-opacity: 1;
    stroke-width: 0;
  }

  100% {
    stroke-opacity: 0;
    stroke-width: 30px;
  }
}
</style>
