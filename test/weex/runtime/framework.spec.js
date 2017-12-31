import { getRoot, createInstance } from '../helpers/index'

describe('framework APIs', () => {
  it('createInstance', () => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      new Vue({
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: 'Hello' }}, [])
          ])
        },
        el: "body"
      })
    `)
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [{ type: 'text', attr: { value: 'Hello' }}]
    })
  })

  it('createInstance with config', () => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      new Vue({
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: JSON.stringify(weex.config) }}, [])
          ])
        },
        el: "body"
      })
    `, { bundleType: 'Vue', bundleUrl: 'http://example.com/', a: 1, b: 2 })
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [{
        type: 'text',
        attr: { value: '{"bundleType":"Vue","bundleUrl":"http://example.com/","a":1,"b":2,"env":{}}' }
      }]
    })
  })

  it('createInstance with external data', () => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      new Vue({
        data: {
          a: 1,
          b: 2
        },
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: this.a + '-' + this.b }}, [])
          ])
        },
        el: "body"
      })
    `, undefined, { a: 111 })
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [{ type: 'text', attr: { value: '111-2' }}]
    })
  })

  it('destroyInstance', (done) => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      new Vue({
        data: {
          x: 'Hello'
        },
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: this.x }}, [])
          ])
        },
        el: "body"
      })
    `)
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [{ type: 'text', attr: { value: 'Hello' }}]
    })
    instance.$destroy()
    setTimeout(() => {
      expect(instance.document).toBeUndefined()
      expect(instance.app).toBeUndefined()
      done()
    }, 0)
  })

  it('refreshInstance', (done) => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      new Vue({
        data: {
          x: 'Hello'
        },
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: this.x }}, [])
          ])
        },
        el: "body"
      })
    `)
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [{ type: 'text', attr: { value: 'Hello' }}]
    })
    instance.$refresh({ x: 'World' })
    setTimeout(() => {
      expect(getRoot(instance)).toEqual({
        type: 'div',
        children: [{ type: 'text', attr: { value: 'World' }}]
      })
      instance.$destroy()
      const result = instance.$refresh({ x: 'World' })
      expect(result instanceof Error).toBe(true)
      done()
    })
  })

  it('registering global assets', () => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      Vue.component('test', {
        render (h) {
          return h('div', 'Hello')
        }
      })
      new Vue({
        render (h) {
          return h('test')
        },
        el: 'body'
      })
    `)
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [{ type: 'text', attr: { value: 'Hello' }}]
    })
  })

  it('adding prototype methods', () => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      Vue.prototype.$test = () => 'Hello'
      const Test = {
        render (h) {
          return h('div', this.$test())
        }
      }
      new Vue({
        render (h) {
          return h(Test)
        },
        el: 'body'
      })
    `)
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [{ type: 'text', attr: { value: 'Hello' }}]
    })
  })

  it('using global mixins', () => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      Vue.mixin({
        created () {
          this.test = true
        }
      })
      const Test = {
        data: () => ({ test: false }),
        render (h) {
          return h('div', this.test ? 'Hello' : 'nope')
        }
      }
      new Vue({
        data: { test: false },
        render (h) {
          return this.test ? h(Test) : h('p')
        },
        el: 'body'
      })
    `)
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [{ type: 'text', attr: { value: 'Hello' }}]
    })
  })
})
