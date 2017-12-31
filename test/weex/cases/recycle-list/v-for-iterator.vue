<template>
  <recycle-list for="item in longList" switch="type">
    <cell-slot case="A">
      <div v-for="(object, index) in item.list" :key="index">
        <text>{{object.name}}</text>
        <text v-for="(v, k, i) in object" :key="k">{{v}}</text>
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

