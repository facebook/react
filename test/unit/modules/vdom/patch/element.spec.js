import Vue from 'vue'
import { patch } from 'web/runtime/patch'
import VNode from 'core/vdom/vnode'

describe('vdom patch: element', () => {
  it('should create an element', () => {
    const vnode = new VNode('p', { attrs: { id: '1' }}, [createTextVNode('hello world')])
    const elm = patch(null, vnode)
    expect(elm.tagName).toBe('P')
    expect(elm.outerHTML).toBe('<p id="1">hello world</p>')
  })

  it('should create an element which having the namespace', () => {
    const vnode = new VNode('svg', {})
    vnode.ns = 'svg'
    const elm = patch(null, vnode)
    expect(elm.namespaceURI).toBe('http://www.w3.org/2000/svg')
  })

  const el = document.createElement('unknown')
  // Android Browser <= 4.2 doesn't use correct class name,
  // but it doesn't matter because no one's gonna use it as their primary
  // development browser.
  if (/HTMLUnknownElement/.test(el.toString())) {
    it('should warn unknown element', () => {
      const vnode = new VNode('unknown')
      patch(null, vnode)
      expect(`Unknown custom element: <unknown>`).toHaveBeenWarned()
    })
  }

  it('should warn unknown element with hyphen', () => {
    const vnode = new VNode('unknown-foo')
    patch(null, vnode)
    expect(`Unknown custom element: <unknown-foo>`).toHaveBeenWarned()
  })

  it('should create an elements which having text content', () => {
    const vnode = new VNode('div', {}, [createTextVNode('hello world')])
    const elm = patch(null, vnode)
    expect(elm.innerHTML).toBe('hello world')
  })

  it('should create create an elements which having span and text content', () => {
    const vnode = new VNode('div', {}, [
      new VNode('span'),
      createTextVNode('hello world')
    ])
    const elm = patch(null, vnode)
    expect(elm.childNodes[0].tagName).toBe('SPAN')
    expect(elm.childNodes[1].textContent).toBe('hello world')
  })

  it('should create element with scope attribute', () => {
    const vnode = new VNode('div')
    vnode.context = new Vue({ _scopeId: 'foo' })
    const elm = patch(null, vnode)
    expect(elm.hasAttribute('foo')).toBe(true)
  })
})
