<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="X">
      <lifecycle></lifecycle>
    </cell-slot>
  </recycle-list>
</template>

<script>
  // require('./lifecycle.vue')
  module.exports = {
    data () {
      return {
        longList: [
          { type: 'X' },
          { type: 'X' }
        ]
      }
    }
  }
</script>
