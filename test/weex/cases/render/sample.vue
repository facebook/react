<template>
  <div style="justify-content:center">
    <text class="freestyle">{{string}}</text>
  </div>
</template>

<style scoped>
  .freestyle {
    color: #41B883;
    font-size: 233px;
    text-align: center;
  }
</style>

<script>
  module.exports = {
    data () {
      return {
        string: 'Yo'
      }
    }
  }
</script>
