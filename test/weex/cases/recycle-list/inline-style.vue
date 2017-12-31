<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="A" style="background-color:#FF6600">
      <text :style="{ fontSize: '100px', color: item.color }">content</text>
    </cell-slot>
  </recycle-list>
</template>

<script>
  module.exports = {
    data () {
      return {
        longList: [
          { type: 'A', color: '#606060' },
          { type: 'A', color: '#E5E5E5' }
        ]
      }
    }
  }
</script>

