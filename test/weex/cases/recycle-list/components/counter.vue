<template recyclable="true">
  <div>
    <text class="output">{{count}}</text>
    <text class="button" @click="inc">+</text>
  </div>
</template>

<script>
  module.exports = {
    props: ['start'],
    data () {
      return {
        count: parseInt(this.start, 10) * 2 || 42
      }
    },
    methods: {
      inc () {
        this.count++
      }
    }
  }
</script>

<style scoped>
  .output {
    font-size: 150px;
    text-align: center;
  }
  .button {
    font-size: 100px;
    text-align: center;
    border-width: 2px;
    border-color: #DDD;
    background-color: #F5F5F5;
  }
</style>
