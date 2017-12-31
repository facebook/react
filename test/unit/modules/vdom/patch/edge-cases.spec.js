import Vue from 'vue'

describe('vdom patch: edge cases', () => {
  // exposed by #3406
  // When a static vnode is inside v-for, it's possible for the same vnode
  // to be used in multiple places, and its element will be replaced. This
  // causes patch errors when node ops depend on the vnode's element position.
  it('should handle static vnodes by key', done => {
    const vm = new Vue({
      data: {
        ok: true
      },
      template: `
        <div>
          <div v-for="i in 2">
            <div v-if="ok">a</div><div>b</div><div v-if="!ok">c</div><div>d</div>
          </div>
        </div>
      `
    }).$mount()
    expect(vm.$el.textContent).toBe('abdabd')
    vm.ok = false
    waitForUpdate(() => {
      expect(vm.$el.textContent).toBe('bcdbcd')
    }).then(done)
  })

  // #3533
  // a static node is reused in createElm, which changes its elm reference
  // and is inserted into a different parent.
  // later when patching the next element a DOM insertion uses it as the
  // reference node, causing a parent mismatch.
  it('should handle static node edge case when it\'s reused AND used as a reference node for insertion', done => {
    const vm = new Vue({
      data: {
        ok: true
      },
      template: `
        <div>
          <button @click="ok = !ok">toggle</button>
          <div class="b" v-if="ok">123</div>
          <div class="c">
            <div><span/></div><p>{{ 1 }}</p>
          </div>
          <div class="d">
            <label>{{ 2 }}</label>
          </div>
          <div class="b" v-if="ok">123</div>
        </div>
      `
    }).$mount()

    expect(vm.$el.querySelector('.c').textContent).toBe('1')
    expect(vm.$el.querySelector('.d').textContent).toBe('2')
    vm.ok = false
    waitForUpdate(() => {
      expect(vm.$el.querySelector('.c').textContent).toBe('1')
      expect(vm.$el.querySelector('.d').textContent).toBe('2')
    }).then(done)
  })

  it('should handle slot nodes being reused across render', done => {
    const vm = new Vue({
      template: `
        <foo ref="foo">
          <div>slot</div>
        </foo>
      `,
      components: {
        foo: {
          data () {
            return { ok: true }
          },
          render (h) {
            const children = [
              this.ok ? h('div', 'toggler ') : null,
              h('div', [this.$slots.default, h('span', ' 1')]),
              h('div', [h('label', ' 2')])
            ]
            return h('div', children)
          }
        }
      }
    }).$mount()
    expect(vm.$el.textContent).toContain('toggler slot 1 2')
    vm.$refs.foo.ok = false
    waitForUpdate(() => {
      expect(vm.$el.textContent).toContain('slot 1 2')
      vm.$refs.foo.ok = true
    }).then(() => {
      expect(vm.$el.textContent).toContain('toggler slot 1 2')
      vm.$refs.foo.ok = false
    }).then(() => {
      expect(vm.$el.textContent).toContain('slot 1 2')
      vm.$refs.foo.ok = true
    }).then(done)
  })

  it('should synchronize vm\' vnode', done => {
    const comp = {
      data: () => ({ swap: true }),
      render (h) {
        return this.swap
          ? h('a', 'atag')
          : h('span', 'span')
      }
    }

    const wrapper = {
      render: h => h('comp'),
      components: { comp }
    }

    const vm = new Vue({
      render (h) {
        const children = [
          h('wrapper'),
          h('div', 'row')
        ]
        if (this.swap) {
          children.reverse()
        }
        return h('div', children)
      },
      data: () => ({ swap: false }),
      components: { wrapper }
    }).$mount()

    expect(vm.$el.innerHTML).toBe('<a>atag</a><div>row</div>')
    const wrapperVm = vm.$children[0]
    const compVm = wrapperVm.$children[0]
    vm.swap = true
    waitForUpdate(() => {
      expect(compVm.$vnode.parent).toBe(wrapperVm.$vnode)
      expect(vm.$el.innerHTML).toBe('<div>row</div><a>atag</a>')
      vm.swap = false
    }).then(() => {
      expect(compVm.$vnode.parent).toBe(wrapperVm.$vnode)
      expect(vm.$el.innerHTML).toBe('<a>atag</a><div>row</div>')
      compVm.swap = false
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>span</span><div>row</div>')
      expect(compVm.$vnode.parent).toBe(wrapperVm.$vnode)
      vm.swap = true
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<div>row</div><span>span</span>')
      expect(compVm.$vnode.parent).toBe(wrapperVm.$vnode)
      vm.swap = true
    }).then(done)
  })

  // #4530
  it('should not reset value when patching between dynamic/static bindings', done => {
    const vm = new Vue({
      data: { ok: true },
      template: `
        <div>
          <input type="button" v-if="ok" value="a">
          <input type="button" :value="'b'">
        </div>
      `
    }).$mount()
    expect(vm.$el.children[0].value).toBe('a')
    vm.ok = false
    waitForUpdate(() => {
      expect(vm.$el.children[0].value).toBe('b')
      vm.ok = true
    }).then(() => {
      expect(vm.$el.children[0].value).toBe('a')
    }).then(done)
  })

  // #6313
  it('should not replace node when switching between text-like inputs', done => {
    const vm = new Vue({
      data: { show: false },
      template: `
        <div>
          <input :type="show ? 'text' : 'password'">
        </div>
      `
    }).$mount()
    const node = vm.$el.children[0]
    expect(vm.$el.children[0].type).toBe('password')
    vm.$el.children[0].value = 'test'
    vm.show = true
    waitForUpdate(() => {
      expect(vm.$el.children[0]).toBe(node)
      expect(vm.$el.children[0].value).toBe('test')
      expect(vm.$el.children[0].type).toBe('text')
      vm.show = false
    }).then(() => {
      expect(vm.$el.children[0]).toBe(node)
      expect(vm.$el.children[0].value).toBe('test')
      expect(vm.$el.children[0].type).toBe('password')
    }).then(done)
  })

  it('should properly patch nested HOC when root element is replaced', done => {
    const vm = new Vue({
      template: `<foo class="hello" ref="foo" />`,
      components: {
        foo: {
          template: `<bar ref="bar" />`,
          components: {
            bar: {
              template: `<div v-if="ok"></div><span v-else></span>`,
              data () {
                return { ok: true }
              }
            }
          }
        }
      }
    }).$mount()

    expect(vm.$refs.foo.$refs.bar.$el.tagName).toBe('DIV')
    expect(vm.$refs.foo.$refs.bar.$el.className).toBe(`hello`)

    vm.$refs.foo.$refs.bar.ok = false
    waitForUpdate(() => {
      expect(vm.$refs.foo.$refs.bar.$el.tagName).toBe('SPAN')
      expect(vm.$refs.foo.$refs.bar.$el.className).toBe(`hello`)
    }).then(done)
  })

  // #6790
  it('should not render undefined for empty nested arrays', () => {
    const vm = new Vue({
      template: `<div><template v-for="i in emptyArr"></template></div>`,
      data: { emptyArr: [] }
    }).$mount()
    expect(vm.$el.textContent).toBe('')
  })

  // #6803
  it('backwards compat with checkbox code generated before 2.4', () => {
    const spy = jasmine.createSpy()
    const vm = new Vue({
      data: {
        label: 'foobar',
        name: 'foobar'
      },
      computed: {
        value: {
          get () {
            return 1
          },
          set: spy
        }
      },
      render (h) {
        const _vm = this
        return h('div', {},
          [h('input', {
            directives: [{
              name: 'model',
              rawName: 'v-model',
              value: (_vm.value),
              expression: 'value'
            }],
            attrs: {
              'type': 'radio',
              'name': _vm.name
            },
            domProps: {
              'value': _vm.label,
              'checked': _vm._q(_vm.value, _vm.label)
            },
            on: {
              '__c': function ($event) {
                _vm.value = _vm.label
              }
            }
          })])
      }
    }).$mount()

    document.body.appendChild(vm.$el)
    vm.$el.children[0].click()
    expect(spy).toHaveBeenCalled()
  })

  // #7041
  it('transition children with only deep bindings should be patched on update', done => {
    const vm = new Vue({
      template: `
      <div>
        <transition>
          <div :style="style"></div>
        </transition>
      </div>
      `,
      data: () => ({
        style: { color: 'red' }
      })
    }).$mount()
    expect(vm.$el.children[0].style.color).toBe('red')
    vm.style.color = 'green'
    waitForUpdate(() => {
      expect(vm.$el.children[0].style.color).toBe('green')
    }).then(done)
  })

  // #7294
  it('should cleanup component inline events on patch when no events are present', done => {
    const log = jasmine.createSpy()
    const vm = new Vue({
      data: { ok: true },
      template: `
        <div>
          <foo v-if="ok" @custom="log"/>
          <foo v-else/>
        </div>
      `,
      components: {
        foo: {
          render () {}
        }
      },
      methods: { log }
    }).$mount()

    vm.ok = false
    waitForUpdate(() => {
      vm.$children[0].$emit('custom')
      expect(log).not.toHaveBeenCalled()
    }).then(done)
  })
})
