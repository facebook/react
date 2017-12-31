<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="A">
      <image resize="cover" :src="item.source">
      <text lines="3" v-bind:count="item.count"></text>
    </cell-slot>
  </recycle-list>
</template>

<script>
  module.exports = {
    data () {
      return {
        longList: [
          { type: 'A', count: 1, source: 'http://whatever.com/x.png' },
          { type: 'A', count: 2, source: 'http://whatever.com/y.png' },
          { type: 'A', count: 3, source: 'http://whatever.com/z.png' }
        ]
      }
    }
  }
</script>

