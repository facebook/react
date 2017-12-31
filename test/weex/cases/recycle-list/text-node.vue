<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="A">
      <text>static</text>
      <text>{{item.dynamic}}</text>
      <text>one {{item.two}} three {{ item.four }} five</text>
    </cell-slot>
  </recycle-list>
</template>

<script>
  module.exports = {
    data () {
      return {
        longList: [
          { type: 'A', dynamic: 'decimal', two: '2', four: '4' },
          { type: 'A', dynamic: 'binary', two: '10', four: '100' }
        ]
      }
    }
  }
</script>

