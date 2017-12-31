import Vue from 'vue'
import { createEmptyVNode } from 'core/vdom/vnode'

describe('create-element', () => {
  it('render vnode with basic reserved tag using createElement', () => {
    const vm = new Vue({
      data: { msg: 'hello world' }
    })
    const h = vm.$createElement
    const vnode = h('p', {})
    expect(vnode.tag).toBe('p')
    expect(vnode.data).toEqual({})
    expect(vnode.children).toBeUndefined()
    expect(vnode.text).toBeUndefined()
    expect(vnode.elm).toBeUndefined()
    expect(vnode.ns).toBeUndefined()
    expect(vnode.context).toEqual(vm)
  })

  it('render vnode with component using createElement', () => {
    const vm = new Vue({
      data: { message: 'hello world' },
      components: {
        'my-component': {
          props: ['msg']
        }
      }
    })
    const h = vm.$createElement
    const vnode = h('my-component', { props: { msg: vm.message }})
    expect(vnode.tag).toMatch(/vue-component-[0-9]+/)
    expect(vnode.componentOptions.propsData).toEqual({ msg: vm.message })
    expect(vnode.children).toBeUndefined()
    expect(vnode.text).toBeUndefined()
    expect(vnode.elm).toBeUndefined()
    expect(vnode.ns).toBeUndefined()
    expect(vnode.context).toEqual(vm)
  })

  it('render vnode with custom tag using createElement', () => {
    const vm = new Vue({
      data: { msg: 'hello world' }
    })
    const h = vm.$createElement
    const tag = 'custom-tag'
    const vnode = h(tag, {})
    expect(vnode.tag).toBe('custom-tag')
    expect(vnode.data).toEqual({})
    expect(vnode.children).toBeUndefined()
    expect(vnode.text).toBeUndefined()
    expect(vnode.elm).toBeUndefined()
    expect(vnode.ns).toBeUndefined()
    expect(vnode.context).toEqual(vm)
    expect(vnode.componentOptions).toBeUndefined()
  })

  it('render empty vnode with falsy tag using createElement', () => {
    const vm = new Vue({
      data: { msg: 'hello world' }
    })
    const h = vm.$createElement
    const vnode = h(null, {})
    expect(vnode).toEqual(createEmptyVNode())
  })

  it('render vnode with not string tag using createElement', () => {
    const vm = new Vue({
      data: { msg: 'hello world' }
    })
    const h = vm.$createElement
    const vnode = h(Vue.extend({ // Component class
      props: ['msg']
    }), { props: { msg: vm.message }})
    expect(vnode.tag).toMatch(/vue-component-[0-9]+/)
    expect(vnode.componentOptions.propsData).toEqual({ msg: vm.message })
    expect(vnode.children).toBeUndefined()
    expect(vnode.text).toBeUndefined()
    expect(vnode.elm).toBeUndefined()
    expect(vnode.ns).toBeUndefined()
    expect(vnode.context).toEqual(vm)
  })

  it('render vnode with createElement with children', () => {
    const vm = new Vue({})
    const h = vm.$createElement
    const vnode = h('p', void 0, [h('br'), 'hello world', h('br')])
    expect(vnode.children[0].tag).toBe('br')
    expect(vnode.children[1].text).toBe('hello world')
    expect(vnode.children[2].tag).toBe('br')
  })

  it('render vnode with children, omitting data', () => {
    const vm = new Vue({})
    const h = vm.$createElement
    const vnode = h('p', [h('br'), 'hello world', h('br')])
    expect(vnode.children[0].tag).toBe('br')
    expect(vnode.children[1].text).toBe('hello world')
    expect(vnode.children[2].tag).toBe('br')
  })

  it('render vnode with children, including boolean and null type', () => {
    const vm = new Vue({})
    const h = vm.$createElement
    const vnode = h('p', [h('br'), true, 123, h('br'), 'abc', null])
    expect(vnode.children.length).toBe(4)
    expect(vnode.children[0].tag).toBe('br')
    expect(vnode.children[1].text).toBe('123')
    expect(vnode.children[2].tag).toBe('br')
    expect(vnode.children[3].text).toBe('abc')
  })

  it('render svg elements with correct namespace', () => {
    const vm = new Vue({})
    const h = vm.$createElement
    const vnode = h('svg', [h('a', [h('foo', [h('bar')])])])
    expect(vnode.ns).toBe('svg')
    // should apply ns to children recursively
    expect(vnode.children[0].ns).toBe('svg')
    expect(vnode.children[0].children[0].ns).toBe('svg')
    expect(vnode.children[0].children[0].children[0].ns).toBe('svg')
  })

  it('render MathML elements with correct namespace', () => {
    const vm = new Vue({})
    const h = vm.$createElement
    const vnode = h('math', [h('matrix')])
    expect(vnode.ns).toBe('math')
    // should apply ns to children
    expect(vnode.children[0].ns).toBe('math')
    // although not explicitly listed, elements nested under <math>
    // should not be treated as component
    expect(vnode.children[0].componentOptions).toBeUndefined()
  })

  it('render svg foreignObject with correct namespace', () => {
    const vm = new Vue({})
    const h = vm.$createElement
    const vnode = h('svg', [h('foreignObject', [h('p')])])
    expect(vnode.ns).toBe('svg')
    expect(vnode.children[0].ns).toBe('svg')
    expect(vnode.children[0].children[0].ns).toBeUndefined()
  })

  // #6642
  it('render svg foreignObject component with correct namespace', () => {
    const vm = new Vue({
      template: `
        <svg>
          <test></test>
        </svg>
      `,
      components: {
        test: {
          template: `
          <foreignObject>
            <p xmlns="http://www.w3.org/1999/xhtml"></p>
          </foreignObject>
          `
        }
      }
    }).$mount()
    const testComp = vm.$children[0]
    expect(testComp.$vnode.ns).toBe('svg')
    expect(testComp._vnode.tag).toBe('foreignObject')
    expect(testComp._vnode.ns).toBe('svg')
    expect(testComp._vnode.children[0].tag).toBe('p')
    expect(testComp._vnode.children[0].ns).toBeUndefined()
  })

  // #6506
  it('render SVGAElement in a component correctly', () => {
    const vm = new Vue({
      template: `
        <svg>
          <test></test>
        </svg>
      `,
      components: {
        test: { render: h => h('a') }
      }
    }).$mount()
    const testComp = vm.$children[0]
    expect(testComp.$vnode.ns).toBe('svg')
    expect(testComp._vnode.tag).toBe('a')
    expect(testComp._vnode.ns).toBe('svg')
  })

  it('warn observed data objects', () => {
    new Vue({
      data: {
        data: {}
      },
      render (h) {
        return h('div', this.data)
      }
    }).$mount()
    expect('Avoid using observed data object as vnode data').toHaveBeenWarned()
  })

  it('warn non-primitive key', () => {
    new Vue({
      render (h) {
        return h('div', { key: {}})
      }
    }).$mount()
    expect('Avoid using non-primitive value as key').toHaveBeenWarned()
  })

  it('doesn\'t warn boolean key', () => {
    new Vue({
      render (h) {
        return h('div', { key: true })
      }
    }).$mount()
    expect('Avoid using non-primitive value as key').not.toHaveBeenWarned()
  })

  it('doesn\'t warn symbol key', () => {
    new Vue({
      render (h) {
        return h('div', { key: Symbol('symbol') })
      }
    }).$mount()
    expect('Avoid using non-primitive value as key').not.toHaveBeenWarned()
  })

  it('nested child elements should be updated correctly', done => {
    const vm = new Vue({
      data: { n: 1 },
      render (h) {
        const list = []
        for (let i = 0; i < this.n; i++) {
          list.push(h('span', i))
        }
        const input = h('input', {
          attrs: {
            value: 'a',
            type: 'text'
          }
        })
        return h('div', [[...list, input]])
      }
    }).$mount()
    expect(vm.$el.innerHTML).toContain('<span>0</span><input')
    const el = vm.$el.querySelector('input')
    el.value = 'b'
    vm.n++
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toContain('<span>0</span><span>1</span><input')
      expect(vm.$el.querySelector('input')).toBe(el)
      expect(vm.$el.querySelector('input').value).toBe('b')
    }).then(done)
  })
})
