import { patch } from 'web/runtime/patch'
import VNode from 'core/vdom/vnode'

describe('vdom style module', () => {
  it('should create an element with style', () => {
    const vnode = new VNode('p', { style: { fontSize: '12px' }})
    const elm = patch(null, vnode)
    expect(elm.style.fontSize).toBe('12px')
  })

  it('should create an element with array style', () => {
    const vnode = new VNode('p', { style: [{ fontSize: '12px' }, { color: 'red' }] })
    const elm = patch(null, vnode)
    expect(elm.style.fontSize).toBe('12px')
    expect(elm.style.color).toBe('red')
  })

  it('should change elements style', () => {
    const vnode1 = new VNode('p', { style: { fontSize: '12px' }})
    const vnode2 = new VNode('p', { style: { fontSize: '10px', display: 'block' }})
    patch(null, vnode1)
    const elm = patch(vnode1, vnode2)
    expect(elm.style.fontSize).toBe('10px')
    expect(elm.style.display).toBe('block')
  })

  it('should remove elements attrs', () => {
    const vnode1 = new VNode('p', { style: { fontSize: '12px' }})
    const vnode2 = new VNode('p', { style: { display: 'block' }})
    patch(null, vnode1)
    const elm = patch(vnode1, vnode2)
    expect(elm.style.fontSize).toBe('')
    expect(elm.style.display).toBe('block')
  })
})
