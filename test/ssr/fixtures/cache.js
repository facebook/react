import Vue from '../../../dist/vue.runtime.common.js'

const app = {
  name: 'app',
  props: ['id'],
  serverCacheKey: props => props.id,
  render (h) {
    return h('div', '/test')
  }
}

export default () => {
  return Promise.resolve(new Vue({
    render: h => h(app, { props: { id: 1 }})
  }))
}
