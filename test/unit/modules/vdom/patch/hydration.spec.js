import Vue from 'vue'
import VNode from 'core/vdom/vnode'
import { patch } from 'web/runtime/patch'
import { SSR_ATTR } from 'shared/constants'

function createMockSSRDOM (innerHTML) {
  const dom = document.createElement('div')
  dom.setAttribute(SSR_ATTR, 'true')
  dom.innerHTML = innerHTML
  return dom
}

describe('vdom patch: hydration', () => {
  let vnode0
  beforeEach(() => {
    vnode0 = new VNode('p', { attrs: { id: '1' }}, [createTextVNode('hello world')])
    patch(null, vnode0)
  })

  it('should hydrate elements when server-rendered DOM tree is same as virtual DOM tree', () => {
    const result = []
    function init (vnode) { result.push(vnode) }
    function createServerRenderedDOM () {
      const root = document.createElement('div')
      root.setAttribute(SSR_ATTR, 'true')
      const span = document.createElement('span')
      root.appendChild(span)
      const div = document.createElement('div')
      const child1 = document.createElement('span')
      const child2 = document.createElement('span')
      child1.textContent = 'hi'
      child2.textContent = 'ho'
      div.appendChild(child1)
      div.appendChild(child2)
      root.appendChild(div)
      return root
    }
    const node0 = createServerRenderedDOM()
    const vnode1 = new VNode('div', {}, [
      new VNode('span', {}),
      new VNode('div', { hook: { init }}, [
        new VNode('span', {}, [new VNode(undefined, undefined, undefined, 'hi')]),
        new VNode('span', {}, [new VNode(undefined, undefined, undefined, 'ho')])
      ])
    ])
    patch(node0, vnode1)
    expect(result.length).toBe(1)

    function traverseAndAssert (vnode, element) {
      expect(vnode.elm).toBe(element)
      if (vnode.children) {
        vnode.children.forEach((node, i) => {
          traverseAndAssert(node, element.childNodes[i])
        })
      }
    }
    // ensure vnodes are correctly associated with actual DOM
    traverseAndAssert(vnode1, node0)

    // check update
    const vnode2 = new VNode('div', { attrs: { id: 'foo' }}, [
      new VNode('span', { attrs: { id: 'bar' }}),
      new VNode('div', { hook: { init }}, [
        new VNode('span', {}),
        new VNode('span', {})
      ])
    ])
    patch(vnode1, vnode2)
    expect(node0.id).toBe('foo')
    expect(node0.children[0].id).toBe('bar')
  })

  it('should warn message that virtual DOM tree is not matching when hydrate element', () => {
    function createServerRenderedDOM () {
      const root = document.createElement('div')
      root.setAttribute(SSR_ATTR, 'true')
      const span = document.createElement('span')
      root.appendChild(span)
      const div = document.createElement('div')
      const child1 = document.createElement('span')
      div.appendChild(child1)
      root.appendChild(div)
      return root
    }
    const node0 = createServerRenderedDOM()
    const vnode1 = new VNode('div', {}, [
      new VNode('span', {}),
      new VNode('div', {}, [
        new VNode('span', {}),
        new VNode('span', {})
      ])
    ])
    patch(node0, vnode1)
    expect('The client-side rendered virtual DOM tree is not matching').toHaveBeenWarned()
  })

  // component hydration is better off with a more e2e approach
  it('should hydrate components when server-rendered DOM tree is same as virtual DOM tree', done => {
    const dom = createMockSSRDOM('<span>foo</span><div class="b a"><span>foo qux</span></div><!---->')
    const originalNode1 = dom.children[0]
    const originalNode2 = dom.children[1]

    const vm = new Vue({
      template: '<div><span>{{msg}}</span><test class="a" :msg="msg"></test><p v-if="ok"></p></div>',
      data: {
        msg: 'foo',
        ok: false
      },
      components: {
        test: {
          props: ['msg'],
          data () {
            return { a: 'qux' }
          },
          template: '<div class="b"><span>{{msg}} {{a}}</span></div>'
        }
      }
    })

    expect(() => { vm.$mount(dom) }).not.toThrow()
    expect('not matching server-rendered content').not.toHaveBeenWarned()
    expect(vm.$el).toBe(dom)
    expect(vm.$children[0].$el).toBe(originalNode2)
    expect(vm.$el.children[0]).toBe(originalNode1)
    expect(vm.$el.children[1]).toBe(originalNode2)
    vm.msg = 'bar'
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<span>bar</span><div class="b a"><span>bar qux</span></div><!---->')
      vm.$children[0].a = 'ququx'
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>bar</span><div class="b a"><span>bar ququx</span></div><!---->')
      vm.ok = true
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>bar</span><div class="b a"><span>bar ququx</span></div><p></p>')
    }).then(done)
  })

  it('should warn failed hydration for non-matching DOM in child component', () => {
    const dom = createMockSSRDOM('<div><span></span></div>')

    new Vue({
      template: '<div><test></test></div>',
      components: {
        test: {
          template: '<div><a></a></div>'
        }
      }
    }).$mount(dom)

    expect('not matching server-rendered content').toHaveBeenWarned()
  })

  it('should warn failed hydration when component is not properly registered', () => {
    const dom = createMockSSRDOM('<div><foo></foo></div>')

    new Vue({
      template: '<div><foo></foo></div>'
    }).$mount(dom)

    expect('not matching server-rendered content').toHaveBeenWarned()
    expect('Unknown custom element: <foo>').toHaveBeenWarned()
  })

  it('should overwrite textNodes in the correct position but with mismatching text without warning', () => {
    const dom = createMockSSRDOM('<div><span>foo</span></div>')

    new Vue({
      template: '<div><test></test></div>',
      components: {
        test: {
          data () {
            return { a: 'qux' }
          },
          template: '<div><span>{{a}}</span></div>'
        }
      }
    }).$mount(dom)

    expect('not matching server-rendered content').not.toHaveBeenWarned()
    expect(dom.querySelector('span').textContent).toBe('qux')
  })

  it('should pick up elements with no children and populate without warning', done => {
    const dom = createMockSSRDOM('<div><span></span></div>')
    const span = dom.querySelector('span')

    const vm = new Vue({
      template: '<div><test></test></div>',
      components: {
        test: {
          data () {
            return { a: 'qux' }
          },
          template: '<div><span>{{a}}</span></div>'
        }
      }
    }).$mount(dom)

    expect('not matching server-rendered content').not.toHaveBeenWarned()
    expect(span).toBe(vm.$el.querySelector('span'))
    expect(vm.$el.innerHTML).toBe('<div><span>qux</span></div>')

    vm.$children[0].a = 'foo'
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<div><span>foo</span></div>')
    }).then(done)
  })

  it('should hydrate async component', done => {
    const dom = createMockSSRDOM('<span>foo</span>')
    const span = dom.querySelector('span')

    const Foo = resolve => setTimeout(() => {
      resolve({
        data: () => ({ msg: 'foo' }),
        template: `<span>{{ msg }}</span>`
      })
    }, 0)

    const vm = new Vue({
      template: '<div><foo ref="foo" /></div>',
      components: { Foo }
    }).$mount(dom)

    expect('not matching server-rendered content').not.toHaveBeenWarned()
    expect(dom.innerHTML).toBe('<span>foo</span>')
    expect(vm.$refs.foo).toBeUndefined()

    setTimeout(() => {
      expect(dom.innerHTML).toBe('<span>foo</span>')
      expect(vm.$refs.foo).not.toBeUndefined()
      vm.$refs.foo.msg = 'bar'
      waitForUpdate(() => {
        expect(dom.innerHTML).toBe('<span>bar</span>')
        expect(dom.querySelector('span')).toBe(span)
      }).then(done)
    }, 50)
  })

  it('should hydrate async component without showing loading', done => {
    const dom = createMockSSRDOM('<span>foo</span>')
    const span = dom.querySelector('span')

    const Foo = () => ({
      component: new Promise(resolve => {
        setTimeout(() => {
          resolve({
            data: () => ({ msg: 'foo' }),
            template: `<span>{{ msg }}</span>`
          })
        }, 10)
      }),
      delay: 1,
      loading: {
        render: h => h('span', 'loading')
      }
    })

    const vm = new Vue({
      template: '<div><foo ref="foo" /></div>',
      components: { Foo }
    }).$mount(dom)

    expect('not matching server-rendered content').not.toHaveBeenWarned()
    expect(dom.innerHTML).toBe('<span>foo</span>')
    expect(vm.$refs.foo).toBeUndefined()

    setTimeout(() => {
      expect(dom.innerHTML).toBe('<span>foo</span>')
    }, 2)

    setTimeout(() => {
      expect(dom.innerHTML).toBe('<span>foo</span>')
      expect(vm.$refs.foo).not.toBeUndefined()
      vm.$refs.foo.msg = 'bar'
      waitForUpdate(() => {
        expect(dom.innerHTML).toBe('<span>bar</span>')
        expect(dom.querySelector('span')).toBe(span)
      }).then(done)
    }, 50)
  })

  it('should hydrate async component by replacing DOM if error occurs', done => {
    const dom = createMockSSRDOM('<span>foo</span>')

    const Foo = () => ({
      component: new Promise((resolve, reject) => {
        setTimeout(() => {
          reject('something went wrong')
        }, 10)
      }),
      error: {
        render: h => h('span', 'error')
      }
    })

    new Vue({
      template: '<div><foo ref="foo" /></div>',
      components: { Foo }
    }).$mount(dom)

    expect('not matching server-rendered content').not.toHaveBeenWarned()
    expect(dom.innerHTML).toBe('<span>foo</span>')

    setTimeout(() => {
      expect('Failed to resolve async').toHaveBeenWarned()
      expect(dom.innerHTML).toBe('<span>error</span>')
      done()
    }, 50)
  })

  it('should hydrate v-html with children', () => {
    const dom = createMockSSRDOM('<span>foo</span>')

    new Vue({
      data: {
        html: `<span>foo</span>`
      },
      template: `<div v-html="html">hello</div>`
    }).$mount(dom)

    expect('not matching server-rendered content').not.toHaveBeenWarned()
  })

  it('should warn mismatching v-html', () => {
    const dom = createMockSSRDOM('<span>bar</span>')

    new Vue({
      data: {
        html: `<span>foo</span>`
      },
      template: `<div v-html="html">hello</div>`
    }).$mount(dom)

    expect('not matching server-rendered content').toHaveBeenWarned()
  })

  it('should hydrate with adjacent text nodes from array children (e.g. slots)', () => {
    const dom = createMockSSRDOM('<div>foo</div> hello')

    new Vue({
      template: `<test>hello</test>`,
      components: {
        test: {
          template: `
            <div>
              <div>foo</div>
              <slot/>
            </div>
          `
        }
      }
    }).$mount(dom)
    expect('not matching server-rendered content').not.toHaveBeenWarned()
  })

  // #7063
  it('should properly initialize dynamic style bindings for future updates', done => {
    const dom = createMockSSRDOM('<div style="padding-left:0px"></div>')

    const vm = new Vue({
      data: {
        style: { paddingLeft: '0px' }
      },
      template: `<div><div :style="style"></div></div>`
    }).$mount(dom)

    // should update
    vm.style.paddingLeft = '100px'
    waitForUpdate(() => {
      expect(dom.children[0].style.paddingLeft).toBe('100px')
    }).then(done)
  })

  it('should properly initialize dynamic class bindings for future updates', done => {
    const dom = createMockSSRDOM('<div class="foo bar"></div>')

    const vm = new Vue({
      data: {
        cls: [{ foo: true }, 'bar']
      },
      template: `<div><div :class="cls"></div></div>`
    }).$mount(dom)

    // should update
    vm.cls[0].foo = false
    waitForUpdate(() => {
      expect(dom.children[0].className).toBe('bar')
    }).then(done)
  })
})
