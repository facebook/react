import Vue from '../../../dist/vue.runtime.common.js'

function createRegisterFn (id) {
  return function (context) {
    context = context || this.$vnode.ssrContext
    context.registered.push(id)
  }
}

function addHooks (comp) {
  const hook = createRegisterFn(comp.name)
  return Object.assign(comp, {
    _ssrRegister: hook,
    beforeCreate: hook
  })
}

const grandchild = addHooks({
  name: 'grandchild',
  props: ['id'],
  serverCacheKey: props => props.id,
  render (h) {
    return h('div', '/test')
  }
})

const child = addHooks({
  name: 'child',
  props: ['id'],
  serverCacheKey: props => props.id,
  render (h) {
    return h(grandchild, { props: { id: this.id }})
  }
})

const app = addHooks({
  name: 'app',
  props: ['id'],
  serverCacheKey: props => props.id,
  render (h) {
    return h(child, { props: { id: this.id }})
  }
})

export default () => {
  return Promise.resolve(new Vue({
    render: h => h(app, { props: { id: 1 }})
  }))
}
