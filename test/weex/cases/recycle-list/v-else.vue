<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="A">
      <image v-if="item.source" :src="item.source"></image>
      <image v-else v-bind:src="item.placeholder"></image>
    </cell-slot>
  </recycle-list>
</template>

<script>
  module.exports = {
    data () {
      return {
        longList: [
          { type: 'A' },
          { type: 'A' }
        ]
      }
    }
  }
</script>

