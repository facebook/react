<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="A">
      <text v-on:click="toggle()" @longpress="toggle(item.key)"></text>
      <text @appear="onappear(item.index, 'static', item.type, $event)">Button</text>
      <text @disappear="onappear(25, 'static')">Tips</text>
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
      hide () {},
      toggle () {},
      onappear () {}
    }
  }
</script>

