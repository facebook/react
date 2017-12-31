import { patch } from 'web/runtime/patch'
import VNode from 'core/vdom/vnode'

describe('vdom events module', () => {
  it('should attach event handler to element', () => {
    const click = jasmine.createSpy()
    const vnode = new VNode('a', { on: { click }})

    const elm = patch(null, vnode)
    document.body.appendChild(elm)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(1)
  })

  it('should not duplicate the same listener', () => {
    const click = jasmine.createSpy()
    const vnode1 = new VNode('a', { on: { click }})
    const vnode2 = new VNode('a', { on: { click }})

    const elm = patch(null, vnode1)
    patch(vnode1, vnode2)
    document.body.appendChild(elm)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(1)
  })

  it('should update different listener', () => {
    const click = jasmine.createSpy()
    const click2 = jasmine.createSpy()
    const vnode1 = new VNode('a', { on: { click }})
    const vnode2 = new VNode('a', { on: { click: click2 }})

    const elm = patch(null, vnode1)
    document.body.appendChild(elm)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(1)
    expect(click2.calls.count()).toBe(0)

    patch(vnode1, vnode2)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(1)
    expect(click2.calls.count()).toBe(1)
  })

  it('should attach Array of multiple handlers', () => {
    const click = jasmine.createSpy()
    const vnode = new VNode('a', { on: { click: [click, click] }})

    const elm = patch(null, vnode)
    document.body.appendChild(elm)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(2)
  })

  it('should update Array of multiple handlers', () => {
    const click = jasmine.createSpy()
    const click2 = jasmine.createSpy()
    const vnode1 = new VNode('a', { on: { click: [click, click2] }})
    const vnode2 = new VNode('a', { on: { click: [click] }})

    const elm = patch(null, vnode1)
    document.body.appendChild(elm)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(1)
    expect(click2.calls.count()).toBe(1)

    patch(vnode1, vnode2)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(2)
    expect(click2.calls.count()).toBe(1)
  })

  it('should remove handlers that are no longer present', () => {
    const click = jasmine.createSpy()
    const vnode1 = new VNode('a', { on: { click }})
    const vnode2 = new VNode('a', {})

    const elm = patch(null, vnode1)
    document.body.appendChild(elm)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(1)

    patch(vnode1, vnode2)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(1)
  })

  it('should remove Array handlers that are no longer present', () => {
    const click = jasmine.createSpy()
    const vnode1 = new VNode('a', { on: { click: [click, click] }})
    const vnode2 = new VNode('a', {})

    const elm = patch(null, vnode1)
    document.body.appendChild(elm)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(2)

    patch(vnode1, vnode2)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(2)
  })

  // #4650
  it('should handle single -> array or array -> single handler changes', () => {
    const click = jasmine.createSpy()
    const click2 = jasmine.createSpy()
    const click3 = jasmine.createSpy()
    const vnode0 = new VNode('a', { on: { click: click }})
    const vnode1 = new VNode('a', { on: { click: [click, click2] }})
    const vnode2 = new VNode('a', { on: { click: click }})
    const vnode3 = new VNode('a', { on: { click: [click2, click3] }})

    const elm = patch(null, vnode0)
    document.body.appendChild(elm)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(1)
    expect(click2.calls.count()).toBe(0)

    patch(vnode0, vnode1)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(2)
    expect(click2.calls.count()).toBe(1)

    patch(vnode1, vnode2)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(3)
    expect(click2.calls.count()).toBe(1)

    patch(vnode2, vnode3)
    triggerEvent(elm, 'click')
    expect(click.calls.count()).toBe(3)
    expect(click2.calls.count()).toBe(2)
    expect(click3.calls.count()).toBe(1)
  })
})
