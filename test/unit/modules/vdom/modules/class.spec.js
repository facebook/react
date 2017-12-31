import { patch } from 'web/runtime/patch'
import VNode from 'core/vdom/vnode'

describe('vdom class module', () => {
  it('should create an element with staticClass', () => {
    const vnode = new VNode('p', { staticClass: 'class1' })
    const elm = patch(null, vnode)
    expect(elm).toHaveClass('class1')
  })

  it('should create an element with class', () => {
    const vnode = new VNode('p', { class: 'class1' })
    const elm = patch(null, vnode)
    expect(elm).toHaveClass('class1')
  })

  it('should create an element with array class', () => {
    const vnode = new VNode('p', { class: ['class1', 'class2'] })
    const elm = patch(null, vnode)
    expect(elm).toHaveClass('class1')
    expect(elm).toHaveClass('class2')
  })

  it('should create an element with object class', () => {
    const vnode = new VNode('p', {
      class: { class1: true, class2: false, class3: true }
    })
    const elm = patch(null, vnode)
    expect(elm).toHaveClass('class1')
    expect(elm).not.toHaveClass('class2')
    expect(elm).toHaveClass('class3')
  })

  it('should create an element with mixed class', () => {
    const vnode = new VNode('p', {
      class: [{ class1: false, class2: true, class3: false }, 'class4', ['class5', 'class6']]
    })
    const elm = patch(null, vnode)
    expect(elm).not.toHaveClass('class1')
    expect(elm).toHaveClass('class2')
    expect(elm).not.toHaveClass('class3')
    expect(elm).toHaveClass('class4')
    expect(elm).toHaveClass('class5')
    expect(elm).toHaveClass('class6')
  })

  it('should create an element with staticClass and class', () => {
    const vnode = new VNode('p', { staticClass: 'class1', class: 'class2' })
    const elm = patch(null, vnode)
    expect(elm).toHaveClass('class1')
    expect(elm).toHaveClass('class2')
  })

  it('should handle transition class', () => {
    const vnode1 = new VNode('p', {
      class: { class1: true, class2: false, class3: true }
    })
    let elm = patch(null, vnode1)
    elm._transitionClasses = ['class4']
    const vnode2 = new VNode('p', {
      class: { class1: true, class2: true, class3: true }
    })
    elm = patch(vnode1, vnode2)
    expect(elm).toHaveClass('class1')
    expect(elm).toHaveClass('class2')
    expect(elm).toHaveClass('class3')
    expect(elm).toHaveClass('class4')
  })

  it('should change the elements class', () => {
    const vnode1 = new VNode('p', {
      class: { class1: true, class2: false, class3: true }
    })
    const vnode2 = new VNode('p', { staticClass: 'foo bar' })
    let elm = patch(null, vnode1)
    elm = patch(vnode1, vnode2)
    expect(elm).not.toHaveClass('class1')
    expect(elm).not.toHaveClass('class2')
    expect(elm).not.toHaveClass('class3')
    expect(elm).toHaveClass('foo')
    expect(elm).toHaveClass('bar')
  })

  it('should remove the elements class', () => {
    const vnode1 = new VNode('p', {
      class: { class1: true, class2: false, class3: true }
    })
    const vnode2 = new VNode('p', { class: {}})
    let elm = patch(null, vnode1)
    elm = patch(vnode1, vnode2)
    expect(elm).not.toHaveClass('class1')
    expect(elm).not.toHaveClass('class2')
    expect(elm).not.toHaveClass('class3')
  })

  it('should remove class for new nodes without class data', () => {
    const vnode1 = new VNode('p', {
      class: { class1: true, class2: false, class3: true }
    })
    const vnode2 = new VNode('p', {})
    let elm = patch(null, vnode1)
    elm = patch(vnode1, vnode2)
    expect(elm).not.toHaveClass('class1')
    expect(elm).not.toHaveClass('class2')
    expect(elm).not.toHaveClass('class3')
  })
})
