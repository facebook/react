<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="A">
      <banner></banner>
      <text>content</text>
    </cell-slot>
  </recycle-list>
</template>

<script>
  // require('./banner.vue')
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
