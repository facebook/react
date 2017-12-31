<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="A">
      <editor message="No binding"></editor>
    </cell-slot>
  </recycle-list>
</template>

<script>
  // require('./editor.vue')
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
