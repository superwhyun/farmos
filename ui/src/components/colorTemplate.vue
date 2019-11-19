<template>
  <transition name="fade">
    <div style="border-radius: 25px;" v-bind:style="{ backgroundColor: tweenedCSSColor}">
      <slot></slot>
    </div>
  </transition>
</template>

<script>
import TWEEN from '@tweenjs/tween.js'
import Color from 'color'

export default {
  props: {
    value: [Number, String]
  },
  data () {
    return {
      baseColor: Color('white').object(),
      targetColor: Color('#dddddddd').object(),
      backColor: Color('white').object()
    }
  },
  watch: {
    value: function (newValue, oldValue) {
      const start = new TWEEN.Tween(this.backColor).to(this.targetColor, 500)
      const last = new TWEEN.Tween(this.backColor).to(this.baseColor, 3000)

      start.chain(last)
      start.start()
      this.animate()
    }
  },
  computed: {
    tweenedCSSColor: function () {
      return Color(this.backColor).hex()
    }
  },
  methods: {
    animate () {
      if (TWEEN.update()) {
        requestAnimationFrame(this.animate)
      }
    }
  }
}
</script>
