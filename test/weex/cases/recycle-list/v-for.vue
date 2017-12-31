<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="A">
      <div v-for="panel in item.list" :key="panel.id">
        <text>{{panel.label}}</text>
      </div>
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

