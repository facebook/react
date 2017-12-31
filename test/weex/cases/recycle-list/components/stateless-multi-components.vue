<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="A">
      <banner></banner>
      <text>----</text>
      <footer></footer>
    </cell-slot>
    <cell-slot case="B">
      <banner></banner>
      <poster :image-url="item.poster" :title="item.title"></poster>
    </cell-slot>
  </recycle-list>
</template>

<script>
  // require('./banner.vue')
  // require('./footer.vue')
  // require('./poster.vue')
  module.exports = {
    data () {
      return {
        longList: [
          { type: 'A' },
          { type: 'B', poster: 'yy', title: 'y' },
          { type: 'A' }
        ]
      }
    }
  }
</script>
