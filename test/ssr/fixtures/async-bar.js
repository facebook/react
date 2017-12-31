module.exports = {
  beforeCreate () {
    this.$vnode.ssrContext._registeredComponents.add('__MODULE_ID__')
  },
  render (h) {
    return h('div', 'async bar')
  }
}
