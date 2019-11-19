<template>
  <div class="col-xxs-12 mx-auto my-auto">
    <div></div>
    {{testData2.a}}
    <button @click="testDataChg">testDataChg</button>
  </div>
</template>

<script>
export default {
  methods: {
    testDataChg () {
      this.testData2.a = this.testData2.a + 1
    }
  },
  data () {
    return {
      testData: [1, 2, 3],
      testData2: {
        a: 0
      }
    }
  }
}
</script>

<style lang="scss">
</style>
