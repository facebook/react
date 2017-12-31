import Vue from 'vue'
import { patch } from 'web/runtime/patch'
import VNode from 'core/vdom/vnode'

describe('vdom directive module', () => {
  it('should work', () => {
    const directive1 = {
      bind: jasmine.createSpy('bind'),
      update: jasmine.createSpy('update'),
      unbind: jasmine.createSpy('unbind')
    }
    const vm = new Vue({ directives: { directive1 }})
    // create
    const vnode1 = new VNode('div', {}, [
      new VNode('p', {
        directives: [{
          name: 'directive1', value: 'hello', arg: 'arg1', modifiers: { modifier1: true }
        }]
      }, undefined, 'hello world', undefined, vm)
    ])
    patch(null, vnode1)
    expect(directive1.bind).toHaveBeenCalled()
    // update
    const vnode2 = new VNode('div', {}, [
      new VNode('p', {
        directives: [{
          name: 'directive1', value: 'world', arg: 'arg1', modifiers: { modifier1: true }
        }]
      }, undefined, 'hello world', undefined, vm)
    ])
    patch(vnode1, vnode2)
    expect(directive1.update).toHaveBeenCalled()
    // destroy
    const vnode3 = new VNode('div')
    patch(vnode2, vnode3)
    expect(directive1.unbind).toHaveBeenCalled()
  })
})
