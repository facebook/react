<template recyclable="true">
  <div>
    <text class="output">{{output}}</text>
    <input class="input" type="text" v-model="output" />
  </div>
</template>

<script>
  module.exports = {
    props: ['message'],
    data () {
      return {
        output: this.message || ''
      }
    }
  }
</script>

<style scoped>
  .output {
    height: 80px;
    font-size: 60px;
    color: #41B883;
  }
  .input {
    font-size: 50px;
    color: #666666;
    border-width: 2px;
    border-color: #41B883;
  }
</style>
