import Vue from '../../../dist/vue.runtime.common.js'

// async component!
const Foo = () => import('./async-foo')
const Bar = () => import('./async-bar') // eslint-disable-line

export default context => {
  return new Promise(resolve => {
    context.msg = 'hello'
    const vm = new Vue({
      render (h) {
        return h('div', [
          context.url,
          h(Foo)
        ])
      }
    })

    // simulate router.onReady
    Foo().then(comp => {
      // resolve now to make the render sync
      Foo.resolved = Vue.extend(comp)
      resolve(vm)
    })
  })
}
