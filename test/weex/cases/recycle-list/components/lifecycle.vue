<template recyclable="true">
  <div>
    <text>{{number}}</text>
  </div>
</template>

<script>
  module.exports = {
    data () {
      return { number: 0 }
    },
    beforeCreate () {
      try { __lifecycles.push('beforeCreate ' + this.number) } catch (e) {}
    },
    created () {
      try { __lifecycles.push('created ' + this.number) } catch (e) {}
      this.number++
    },
    beforeMount () {
      try { __lifecycles.push('beforeMount ' + this.number) } catch (e) {}
    },
    mounted () {
      try { __lifecycles.push('mounted ' + this.number) } catch (e) {}
      this.number++
    },
    beforeUpdate () {
      try { __lifecycles.push('beforeUpdate ' + this.number) } catch (e) {}
    },
    updated () {
      try { __lifecycles.push('updated ' + this.number) } catch (e) {}
    },
    beforeDestroy () {
      try { __lifecycles.push('beforeDestroy ' + this.number) } catch (e) {}
    },
    destroyed () {
      try { __lifecycles.push('destroyed ' + this.number) } catch (e) {}
    }
  }
</script>
