import Vue from 'vue'
import { patch } from 'web/runtime/patch'
import VNode from 'core/vdom/vnode'
import { xlinkNS } from 'web/util/index'

describe('vdom attrs module', () => {
  it('should create an element with attrs', () => {
    const vnode = new VNode('p', { attrs: { id: 1, class: 'class1' }})
    const elm = patch(null, vnode)
    expect(elm.id).toBe('1')
    expect(elm).toHaveClass('class1')
  })

  it('should change the elements attrs', () => {
    const vnode1 = new VNode('i', { attrs: { id: '1', class: 'i am vdom' }})
    const vnode2 = new VNode('i', { attrs: { id: '2', class: 'i am' }})
    patch(null, vnode1)
    const elm = patch(vnode1, vnode2)
    expect(elm.id).toBe('2')
    expect(elm).toHaveClass('i')
    expect(elm).toHaveClass('am')
    expect(elm).not.toHaveClass('vdom')
  })

  it('should remove the elements attrs', () => {
    const vnode1 = new VNode('i', { attrs: { id: '1', class: 'i am vdom' }})
    const vnode2 = new VNode('i', { attrs: { id: '1' }})
    patch(null, vnode1)
    const elm = patch(vnode1, vnode2)
    expect(elm.id).toBe('1')
    expect(elm.className).toBe('')
  })

  it('should remove the elements attrs for new nodes without attrs data', () => {
    const vnode1 = new VNode('i', { attrs: { id: '1', class: 'i am vdom' }})
    const vnode2 = new VNode('i', {})
    patch(null, vnode1)
    const elm = patch(vnode1, vnode2)
    expect(elm.id).toBe('')
    expect(elm.className).toBe('')
  })

  it('should remove the falsy value from boolean attr', () => {
    const vnode = new VNode('option', { attrs: { disabled: null }})
    const elm = patch(null, vnode)
    expect(elm.getAttribute('disabled')).toBe(null)
  })

  it('should set the attr name to boolean attr', () => {
    const vnode = new VNode('option', { attrs: { disabled: true }})
    const elm = patch(null, vnode)
    expect(elm.getAttribute('disabled')).toBe('disabled')
  })

  it('should set the falsy value to enumerated attr', () => {
    const vnode = new VNode('div', { attrs: { contenteditable: null }})
    const elm = patch(null, vnode)
    expect(elm.getAttribute('contenteditable')).toBe('false')
  })

  it('should set the boolean string value to enumerated attr', () => {
    const vnode = new VNode('div', { attrs: { contenteditable: 'true' }})
    const elm = patch(null, vnode)
    expect(elm.getAttribute('contenteditable')).toBe('true')
  })

  it('should set the xlink value to attr', () => {
    const vnode = new VNode('a', { attrs: { 'xlink:href': '#id1' }})
    const elm = patch(null, vnode)
    expect(elm.getAttributeNS(xlinkNS, 'href')).toBe('#id1')
  })

  it('should set the xlink boolean string value to attr', () => {
    const vnode = new VNode('option', { attrs: { 'xlink:disabled': true }})
    const elm = patch(null, vnode)
    expect(elm.getAttributeNS(xlinkNS, 'disabled')).toBe('true')
  })

  it('should handle mutating observed attrs object', done => {
    const vm = new Vue({
      data: {
        attrs: {
          id: 'foo'
        }
      },
      render (h) {
        return h('div', {
          attrs: this.attrs
        })
      }
    }).$mount()

    expect(vm.$el.id).toBe('foo')
    vm.attrs.id = 'bar'
    waitForUpdate(() => {
      expect(vm.$el.id).toBe('bar')
      vm.attrs = { id: 'baz' }
    }).then(() => {
      expect(vm.$el.id).toBe('baz')
    }).then(done)
  })
})
