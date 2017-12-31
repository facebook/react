<template>
  <div @click="inc">
    <text>{{count}}</text>
  </div>
</template>

<script>
  module.exports = {
    data () {
      return {
        count: 42
      }
    },
    methods: {
      inc () {
        this.count++
      }
    }
  }
</script>
