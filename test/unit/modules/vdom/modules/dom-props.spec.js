import Vue from 'vue'
import { patch } from 'web/runtime/patch'
import VNode from 'core/vdom/vnode'

describe('vdom domProps module', () => {
  it('should create an element with domProps', () => {
    const vnode = new VNode('a', { domProps: { src: 'http://localhost/' }})
    const elm = patch(null, vnode)
    expect(elm.src).toBe('http://localhost/')
  })

  it('should change the elements domProps', () => {
    const vnode1 = new VNode('a', { domProps: { src: 'http://localhost/' }})
    const vnode2 = new VNode('a', { domProps: { src: 'https://vuejs.org/' }})
    patch(null, vnode1)
    const elm = patch(vnode1, vnode2)
    expect(elm.src).toBe('https://vuejs.org/')
  })

  it('should remove the elements domProps', () => {
    const vnode1 = new VNode('a', { domProps: { src: 'http://localhost/' }})
    const vnode2 = new VNode('a', { domProps: {}})
    patch(null, vnode1)
    const elm = patch(vnode1, vnode2)
    expect(elm.src).toBe('')
  })

  it('should initialize the elements value to zero', () => {
    const vnode = new VNode('input', { domProps: { value: 0 }})
    const elm = patch(null, vnode)
    expect(elm.value).toBe('0')
  })

  it('should save raw value on element', () => {
    const value = {}
    const vnode = new VNode('input', { domProps: { value }})
    const elm = patch(null, vnode)
    expect(elm._value).toBe(value)
  })

  it('should discard vnode children if the node has innerHTML or textContent as a prop', () => {
    const vnode = new VNode('div', { domProps: { innerHTML: 'hi' }}, [
      new VNode('span'), new VNode('span')
    ])
    const elm = patch(null, vnode)
    expect(elm.innerHTML).toBe('hi')
    expect(vnode.children.length).toBe(0)

    const vnode2 = new VNode('div', { domProps: { textContent: 'hi' }}, [
      new VNode('span'), new VNode('span')
    ])
    const elm2 = patch(null, vnode2)
    expect(elm2.textContent).toBe('hi')
    expect(vnode2.children.length).toBe(0)

    const vnode3 = new VNode('div', undefined, undefined, '123')
    patch(null, vnode3)
    const elm3 = patch(vnode3, vnode2)
    expect(elm3.textContent).toBe('hi')

    const vnode4 = new VNode('div', undefined, undefined, new VNode('span'))
    patch(null, vnode4)
    const elm4 = patch(vnode4, vnode)
    expect(elm4.textContent).toBe('hi')
  })

  it('should handle mutating observed props object', done => {
    const vm = new Vue({
      data: {
        props: {
          id: 'foo'
        }
      },
      render (h) {
        return h('div', {
          domProps: this.props
        })
      }
    }).$mount()

    expect(vm.$el.id).toBe('foo')
    vm.props.id = 'bar'
    waitForUpdate(() => {
      expect(vm.$el.id).toBe('bar')
      vm.props = { id: 'baz' }
    }).then(() => {
      expect(vm.$el.id).toBe('baz')
    }).then(done)
  })
})
