<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="A" class="cell">
      <text :class="['text', item.color]">content</text>
    </cell-slot>
  </recycle-list>
</template>

<style scoped>
  .cell {
    background-color: #FF6600;
  }
  .text {
    font-size: 100px;
    text-align: center;
  }
  .red {
    color: #FF0000;
  }
  .blue {
    color: #0000FF;
  }
</style>

<script>
  module.exports = {
    data () {
      return {
        longList: [
          { type: 'A', color: 'red' },
          { type: 'A', color: 'blue' }
        ]
      }
    }
  }
</script>

