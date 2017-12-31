import { patch } from 'web/runtime/patch'
import { createPatchFunction } from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index'
import * as nodeOps from 'web/runtime/node-ops'
import platformModules from 'web/runtime/modules/index'
import VNode from 'core/vdom/vnode'

const modules = baseModules.concat(platformModules)

describe('vdom patch: hooks', () => {
  let vnode0
  beforeEach(() => {
    vnode0 = new VNode('p', { attrs: { id: '1' }}, [createTextVNode('hello world')])
    patch(null, vnode0)
  })

  it('should call `insert` listener after both parents, siblings and children have been inserted', () => {
    const result = []
    function insert (vnode) {
      expect(vnode.elm.children.length).toBe(2)
      expect(vnode.elm.parentNode.children.length).toBe(3)
      result.push(vnode)
    }
    const vnode1 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first sibling'),
      new VNode('div', { hook: { insert }}, [
        new VNode('span', {}, undefined, 'child 1'),
        new VNode('span', {}, undefined, 'child 2')
      ]),
      new VNode('span', {}, undefined, 'can touch me')
    ])
    patch(vnode0, vnode1)
    expect(result.length).toBe(1)
  })

  it('should call `prepatch` listener', () => {
    const result = []
    function prepatch (oldVnode, newVnode) {
      expect(oldVnode).toEqual(vnode1.children[1])
      expect(newVnode).toEqual(vnode2.children[1])
      result.push(newVnode)
    }
    const vnode1 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first sibling'),
      new VNode('div', { hook: { prepatch }}, [
        new VNode('span', {}, undefined, 'child 1'),
        new VNode('span', {}, undefined, 'child 2')
      ])
    ])
    const vnode2 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first sibling'),
      new VNode('div', { hook: { prepatch }}, [
        new VNode('span', {}, undefined, 'child 1'),
        new VNode('span', {}, undefined, 'child 2')
      ])
    ])
    patch(vnode0, vnode1)
    patch(vnode1, vnode2)
    expect(result.length).toBe(1)
  })

  it('should call `postpatch` after `prepatch` listener', () => {
    const pre = []
    const post = []
    function prepatch (oldVnode, newVnode) {
      pre.push(pre)
    }
    function postpatch (oldVnode, newVnode) {
      expect(pre.length).toBe(post.length + 1)
      post.push(post)
    }
    const vnode1 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first sibling'),
      new VNode('div', { hook: { prepatch, postpatch }}, [
        new VNode('span', {}, undefined, 'child 1'),
        new VNode('span', {}, undefined, 'child 2')
      ])
    ])
    const vnode2 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first sibling'),
      new VNode('div', { hook: { prepatch, postpatch }}, [
        new VNode('span', {}, undefined, 'child 1'),
        new VNode('span', {}, undefined, 'child 2')
      ])
    ])
    patch(vnode0, vnode1)
    patch(vnode1, vnode2)
    expect(pre.length).toBe(1)
    expect(post.length).toBe(1)
  })

  it('should call `update` listener', () => {
    const result1 = []
    const result2 = []
    function cb (result, oldVnode, newVnode) {
      if (result.length > 1) {
        expect(result[result.length - 1]).toEqual(oldVnode)
      }
      result.push(newVnode)
    }
    const vnode1 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first sibling'),
      new VNode('div', { hook: { update: cb.bind(null, result1) }}, [
        new VNode('span', {}, undefined, 'child 1'),
        new VNode('span', { hook: { update: cb.bind(null, result2) }}, undefined, 'child 2')
      ])
    ])
    const vnode2 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first sibling'),
      new VNode('div', { hook: { update: cb.bind(null, result1) }}, [
        new VNode('span', {}, undefined, 'child 1'),
        new VNode('span', { hook: { update: cb.bind(null, result2) }}, undefined, 'child 2')
      ])
    ])
    patch(vnode0, vnode1)
    patch(vnode1, vnode2)
    expect(result1.length).toBe(1)
    expect(result2.length).toBe(1)
  })

  it('should call `remove` listener', () => {
    const result = []
    function remove (vnode, rm) {
      const parent = vnode.elm.parentNode
      expect(vnode.elm.children.length).toBe(2)
      expect(vnode.elm.children.length).toBe(2)
      result.push(vnode)
      rm()
      expect(parent.children.length).toBe(1)
    }
    const vnode1 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first sibling'),
      new VNode('div', { hook: { remove }}, [
        new VNode('span', {}, undefined, 'child 1'),
        new VNode('span', {}, undefined, 'child 2')
      ])
    ])
    const vnode2 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first sibling')
    ])
    patch(vnode0, vnode1)
    patch(vnode1, vnode2)
    expect(result.length).toBe(1)
  })

  it('should call `init` and `prepatch` listeners on root', () => {
    let count = 0
    function init (vnode) { count++ }
    function prepatch (oldVnode, newVnode) { count++ }
    const vnode1 = new VNode('div', { hook: { init, prepatch }})
    patch(vnode0, vnode1)
    expect(count).toBe(1)
    const vnode2 = new VNode('span', { hook: { init, prepatch }})
    patch(vnode1, vnode2)
    expect(count).toBe(2)
  })

  it('should remove element when all remove listeners are done', () => {
    let rm1, rm2, rm3
    const patch1 = createPatchFunction({
      nodeOps,
      modules: modules.concat([
        { remove (_, rm) { rm1 = rm } },
        { remove (_, rm) { rm2 = rm } }
      ])
    })
    const vnode1 = new VNode('div', {}, [
      new VNode('a', { hook: { remove (_, rm) { rm3 = rm } }})
    ])
    const vnode2 = new VNode('div', {}, [])
    let elm = patch1(vnode0, vnode1)
    expect(elm.children.length).toBe(1)
    elm = patch1(vnode1, vnode2)
    expect(elm.children.length).toBe(1)
    rm1()
    expect(elm.children.length).toBe(1)
    rm3()
    expect(elm.children.length).toBe(1)
    rm2()
    expect(elm.children.length).toBe(0)
  })

  it('should invoke the remove hook on replaced root', () => {
    const result = []
    const parent = nodeOps.createElement('div')
    vnode0 = nodeOps.createElement('div')
    parent.appendChild(vnode0)
    function remove (vnode, rm) {
      result.push(vnode)
      rm()
    }
    const vnode1 = new VNode('div', { hook: { remove }}, [
      new VNode('b', {}, undefined, 'child 1'),
      new VNode('i', {}, undefined, 'child 2')
    ])
    const vnode2 = new VNode('span', {}, [
      new VNode('b', {}, undefined, 'child 1'),
      new VNode('i', {}, undefined, 'child 2')
    ])
    patch(vnode0, vnode1)
    patch(vnode1, vnode2)
    expect(result.length).toBe(1)
  })

  it('should invoke global `destroy` hook for all removed children', () => {
    const result = []
    function destroy (vnode) { result.push(vnode) }
    const vnode1 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first sibling'),
      new VNode('div', {}, [
        new VNode('span', { hook: { destroy }}, undefined, 'child 1'),
        new VNode('span', {}, undefined, 'child 2')
      ])
    ])
    const vnode2 = new VNode('div')
    patch(vnode0, vnode1)
    patch(vnode1, vnode2)
    expect(result.length).toBe(1)
  })

  it('should handle text vnodes with `undefined` `data` property', () => {
    const vnode1 = new VNode('div', {}, [createTextVNode(' ')])
    const vnode2 = new VNode('div', {}, [])
    patch(vnode0, vnode1)
    patch(vnode1, vnode2)
  })

  it('should invoke `destroy` module hook for all removed children', () => {
    let created = 0
    let destroyed = 0
    const patch1 = createPatchFunction({
      nodeOps,
      modules: modules.concat([
        { create () { created++ } },
        { destroy () { destroyed++ } }
      ])
    })
    const vnode1 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first sibling'),
      new VNode('div', {}, [
        new VNode('span', {}, undefined, 'child 1'),
        new VNode('span', {}, undefined, 'child 2')
      ])
    ])
    const vnode2 = new VNode('div', {})
    patch1(vnode0, vnode1)
    expect(destroyed).toBe(1) // should invoke for replaced root nodes too
    patch1(vnode1, vnode2)
    expect(created).toBe(5)
    expect(destroyed).toBe(5)
  })

  it('should not invoke `create` and `remove` module hook for text nodes', () => {
    let created = 0
    let removed = 0
    const patch1 = createPatchFunction({
      nodeOps,
      modules: modules.concat([
        { create () { created++ } },
        { remove () { removed++ } }
      ])
    })
    const vnode1 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first child'),
      createTextVNode(''),
      new VNode('span', {}, undefined, 'third child')
    ])
    const vnode2 = new VNode('div', {})
    patch1(vnode0, vnode1)
    patch1(vnode1, vnode2)
    expect(created).toBe(3)
    expect(removed).toBe(2)
  })

  it('should not invoke `destroy` module hook for text nodes', () => {
    let created = 0
    let destroyed = 0
    const patch1 = createPatchFunction({
      nodeOps,
      modules: modules.concat([
        { create () { created++ } },
        { destroy () { destroyed++ } }
      ])
    })
    const vnode1 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first sibling'),
      new VNode('div', {}, [
        new VNode('span', {}, undefined, 'child 1'),
        new VNode('span', {}, [
          createTextVNode('text1'),
          createTextVNode('text2')
        ])
      ])
    ])
    const vnode2 = new VNode('div', {})
    patch1(vnode0, vnode1)
    expect(destroyed).toBe(1) // should invoke for replaced root nodes too
    patch1(vnode1, vnode2)
    expect(created).toBe(5)
    expect(destroyed).toBe(5)
  })

  it('should call `create` listener before inserted into parent but after children', () => {
    const result = []
    function create (empty, vnode) {
      expect(vnode.elm.children.length).toBe(2)
      expect(vnode.elm.parentNode).toBe(null)
      result.push(vnode)
    }
    const vnode1 = new VNode('div', {}, [
      new VNode('span', {}, undefined, 'first sibling'),
      new VNode('div', { hook: { create }}, [
        new VNode('span', {}, undefined, 'child 1'),
        new VNode('span', {}, undefined, 'child 2')
      ]),
      new VNode('span', {}, undefined, 'can\'t touch me')
    ])
    patch(vnode0, vnode1)
    expect(result.length).toBe(1)
  })
})
