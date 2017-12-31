import Vue from '../../../dist/vue.runtime.common.js'

export default context => {
  return new Promise(resolve => {
    context.msg = 'hello'
    resolve(new Vue({
      render (h) {
        return h('div', context.url)
      }
    }))
  })
}
