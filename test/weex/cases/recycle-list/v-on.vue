<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="A">
      <text v-on:click="handler" @longpress="move">A</text>
      <text @touchend="move">B</text>
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
    },
    methods: {
      handler () {},
      move () {}
    }
  }
</script>

