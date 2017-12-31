import Vue from 'vue'
import { createComponent } from 'core/vdom/create-component'

describe('create-component', () => {
  let vm
  beforeEach(done => {
    vm = new Vue({
      template: '<p>{{msg}}</p>',
      data () {
        return { msg: 'hello, my children' }
      }
    }).$mount()
    Vue.nextTick(done)
  })

  it('create a component basically', () => {
    const child = {
      name: 'child',
      props: ['msg'],
      render () {}
    }
    const init = jasmine.createSpy()
    const data = {
      props: { msg: 'hello world' },
      attrs: { id: 1 },
      staticAttrs: { class: 'foo' },
      hook: { init },
      on: { notify: 'onNotify' }
    }
    const vnode = createComponent(child, data, vm, vm)
    expect(vnode.tag).toMatch(/vue-component-[0-9]+-child/)
    expect(vnode.data.attrs).toEqual({ id: 1 })
    expect(vnode.data.staticAttrs).toEqual({ class: 'foo' })
    expect(vnode.componentOptions.propsData).toEqual({ msg: 'hello world' })
    expect(vnode.componentOptions.listeners).toEqual({ notify: 'onNotify' })
    expect(vnode.children).toBeUndefined()
    expect(vnode.text).toBeUndefined()
    expect(vnode.elm).toBeUndefined()
    expect(vnode.ns).toBeUndefined()
    expect(vnode.context).toEqual(vm)

    vnode.data.hook.init(vnode)
    expect(init.calls.argsFor(0)[0]).toBe(vnode)
  })

  it('create a component when resolved with async loading', done => {
    let vnode = null
    const data = {
      props: {},
      staticAttrs: { class: 'foo' }
    }
    spyOn(vm, '$forceUpdate')
    function async (resolve, reject) {
      setTimeout(() => {
        resolve({
          name: 'child',
          props: ['msg']
        })
        Vue.nextTick(loaded)
      }, 0)
    }
    function go () {
      vnode = createComponent(async, data, vm, vm)
      expect(vnode.isComment).toBe(true) // not to be loaded yet.
      expect(vnode.asyncFactory).toBe(async)
    }
    function loaded () {
      vnode = createComponent(async, data, vm, vm)
      expect(vnode.tag).toMatch(/vue-component-[0-9]+-child/)
      expect(vnode.data.staticAttrs).toEqual({ class: 'foo' })
      expect(vnode.children).toBeUndefined()
      expect(vnode.text).toBeUndefined()
      expect(vnode.elm).toBeUndefined()
      expect(vnode.ns).toBeUndefined()
      expect(vnode.context).toEqual(vm)
      expect(vm.$forceUpdate).toHaveBeenCalled()
      done()
    }
    go()
  })

  it('not create a component when rejected with async loading', done => {
    let vnode = null
    const data = {
      props: { msg: 'hello world' },
      attrs: { id: 1 }
    }
    const reason = 'failed!!'
    function async (resolve, reject) {
      setTimeout(() => {
        reject(reason)
        Vue.nextTick(failed)
      }, 0)
    }
    function go () {
      vnode = createComponent(async, data, vm, vm)
      expect(vnode.isComment).toBe(true) // not to be loaded yet.
    }
    function failed () {
      vnode = createComponent(async, data, vm, vm)
      expect(vnode.isComment).toBe(true) // failed, still a comment node
      expect(`Failed to resolve async component: ${async}\nReason: ${reason}`).toHaveBeenWarned()
      done()
    }
    go()
  })

  it('not create a component when specified with falsy', () => {
    const vnode = createComponent(null, {}, vm, vm)
    expect(vnode).toBeUndefined()
  })

  it('warn component definition type', () => {
    const Ctor = 'child'
    const vnode = createComponent(Ctor, {}, vm, vm)
    expect(vnode).toBeUndefined()
    expect(`Invalid Component definition: ${Ctor}`).toHaveBeenWarned()
  })
})
