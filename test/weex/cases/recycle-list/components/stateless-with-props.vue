<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="A">
      <poster :image-url="item.poster" :title="item.title"></poster>
      <text>content</text>
    </cell-slot>
  </recycle-list>
</template>

<script>
  // require('./poster.vue')
  module.exports = {
    data () {
      return {
        longList: [
          { type: 'A', poster: 'xx', title: 'x' },
          { type: 'A', poster: 'yy', title: 'y' }
        ]
      }
    }
  }
</script>
