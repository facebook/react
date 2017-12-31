import Vue from 'vue'
import { createEmptyVNode } from 'core/vdom/vnode'

describe('Options functional', () => {
  it('should work', done => {
    const vm = new Vue({
      data: { test: 'foo' },
      template: '<div><wrap :msg="test">bar</wrap></div>',
      components: {
        wrap: {
          functional: true,
          props: ['msg'],
          render (h, { props, children }) {
            return h('div', null, [props.msg, ' '].concat(children))
          }
        }
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<div>foo bar</div>')
    vm.test = 'qux'
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<div>qux bar</div>')
    }).then(done)
  })

  it('should expose all props when not declared', done => {
    const fn = {
      functional: true,
      render (h, { props }) {
        return h('div', `${props.msg} ${props.kebabMsg}`)
      }
    }

    const vm = new Vue({
      data: { test: 'foo' },
      render (h) {
        return h('div', [
          h(fn, {
            props: { msg: this.test },
            attrs: { 'kebab-msg': 'bar' }
          })
        ])
      }
    }).$mount()

    expect(vm.$el.innerHTML).toBe('<div>foo bar</div>')
    vm.test = 'qux'
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<div>qux bar</div>')
    }).then(done)
  })

  it('should expose data.on as listeners', () => {
    const foo = jasmine.createSpy('foo')
    const bar = jasmine.createSpy('bar')
    const vm = new Vue({
      template: '<div><wrap @click="foo" @test="bar"/></div>',
      methods: { foo, bar },
      components: {
        wrap: {
          functional: true,
          render (h, { listeners }) {
            return h('div', {
              on: {
                click: [listeners.click, () => listeners.test('bar')]
              }
            })
          }
        }
      }
    }).$mount()

    triggerEvent(vm.$el.children[0], 'click')
    expect(foo).toHaveBeenCalled()
    expect(foo.calls.argsFor(0)[0].type).toBe('click') // should have click event
    triggerEvent(vm.$el.children[0], 'mousedown')
    expect(bar).toHaveBeenCalledWith('bar')
  })

  it('should support returning more than one root node', () => {
    const vm = new Vue({
      template: `<div><test></test></div>`,
      components: {
        test: {
          functional: true,
          render (h) {
            return [h('span', 'foo'), h('span', 'bar')]
          }
        }
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>foo</span><span>bar</span>')
  })

  it('should support slots', () => {
    const vm = new Vue({
      data: { test: 'foo' },
      template: '<div><wrap><div slot="a">foo</div><div slot="b">bar</div></wrap></div>',
      components: {
        wrap: {
          functional: true,
          props: ['msg'],
          render (h, { slots }) {
            slots = slots()
            return h('div', null, [slots.b, slots.a])
          }
        }
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<div><div>bar</div><div>foo</div></div>')
  })

  it('should let vnode raw data pass through', done => {
    const onValid = jasmine.createSpy('valid')
    const vm = new Vue({
      data: { msg: 'hello' },
      template: `<div>
        <validate field="field1" @valid="onValid">
          <input type="text" v-model="msg">
        </validate>
      </div>`,
      components: {
        validate: {
          functional: true,
          props: ['field'],
          render (h, { props, children, data: { on }}) {
            props.child = children[0]
            return h('validate-control', { props, on })
          }
        },
        'validate-control': {
          props: ['field', 'child'],
          render () {
            return this.child
          },
          mounted () {
            this.$el.addEventListener('input', this.onInput)
          },
          destroyed () {
            this.$el.removeEventListener('input', this.onInput)
          },
          methods: {
            onInput (e) {
              const value = e.target.value
              if (this.validate(value)) {
                this.$emit('valid', this)
              }
            },
            // something validation logic here
            validate (val) {
              return val.length > 0
            }
          }
        }
      },
      methods: { onValid }
    }).$mount()
    document.body.appendChild(vm.$el)
    const input = vm.$el.querySelector('input')
    expect(onValid).not.toHaveBeenCalled()
    waitForUpdate(() => {
      input.value = 'foo'
      triggerEvent(input, 'input')
    }).then(() => {
      expect(onValid).toHaveBeenCalled()
    }).then(() => {
      document.body.removeChild(vm.$el)
      vm.$destroy()
    }).then(done)
  })

  it('create empty vnode when render return null', () => {
    const child = {
      functional: true,
      render () {
        return null
      }
    }
    const vm = new Vue({
      components: {
        child
      }
    })
    const h = vm.$createElement
    const vnode = h('child')
    expect(vnode).toEqual(createEmptyVNode())
  })

  // #7282
  it('should normalize top-level arrays', () => {
    const Foo = {
      functional: true,
      render (h) {
        return [h('span', 'hi'), null]
      }
    }
    const vm = new Vue({
      template: `<div><foo/></div>`,
      components: { Foo }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>hi</span>')
  })

  it('should work when used as named slot and returning array', () => {
    const Foo = {
      template: `<div><slot name="test"/></div>`
    }

    const Bar = {
      functional: true,
      render: h => ([
        h('div', 'one'),
        h('div', 'two'),
        h(Baz)
      ])
    }

    const Baz = {
      functional: true,
      render: h => h('div', 'three')
    }

    const vm = new Vue({
      template: `<foo><bar slot="test"/></foo>`,
      components: { Foo, Bar }
    }).$mount()

    expect(vm.$el.innerHTML).toBe('<div>one</div><div>two</div><div>three</div>')
  })

  it('should apply namespace when returning arrays', () => {
    const Child = {
      functional: true,
      render: h => ([h('foo'), h('bar')])
    }
    const vm = new Vue({
      template: `<svg><child/></svg>`,
      components: { Child }
    }).$mount()

    expect(vm.$el.childNodes[0].namespaceURI).toContain('svg')
    expect(vm.$el.childNodes[1].namespaceURI).toContain('svg')
  })

  it('should work with render fns compiled from template', done => {
    // code generated via vue-template-es2015-compiler
    var render = function (_h, _vm) {
      var _c = _vm._c
      return _c(
        'div',
        [
          _c('h2', { staticClass: 'red' }, [_vm._v(_vm._s(_vm.props.msg))]),
          _vm._t('default'),
          _vm._t('slot2'),
          _vm._t('scoped', null, { msg: _vm.props.msg }),
          _vm._m(0),
          _c('div', { staticClass: 'clickable', on: { click: _vm.parent.fn }}, [
            _vm._v('click me')
          ])
        ],
        2
      )
    }
    var staticRenderFns = [
      function (_h, _vm) {
        var _c = _vm._c
        return _c('div', [_vm._v('Some '), _c('span', [_vm._v('text')])])
      }
    ]

    const child = {
      functional: true,
      _compiled: true,
      render,
      staticRenderFns
    }

    const parent = new Vue({
      components: {
        child
      },
      data: {
        msg: 'hello'
      },
      template: `
      <div>
        <child :msg="msg">
          <span>{{ msg }}</span>
          <div slot="slot2">Second slot</div>
          <template slot="scoped" slot-scope="scope">{{ scope.msg }}</template>
        </child>
      </div>
      `,
      methods: {
        fn () {
          this.msg = 'bye'
        }
      }
    }).$mount()

    function assertMarkup () {
      expect(parent.$el.innerHTML).toBe(
        `<div>` +
          `<h2 class="red">${parent.msg}</h2>` +
          `<span>${parent.msg}</span> ` +
          `<div>Second slot</div>` +
          parent.msg +
          // static
          `<div>Some <span>text</span></div>` +
          `<div class="clickable">click me</div>` +
        `</div>`
      )
    }

    assertMarkup()
    triggerEvent(parent.$el.querySelector('.clickable'), 'click')
    waitForUpdate(assertMarkup).then(done)
  })
})
