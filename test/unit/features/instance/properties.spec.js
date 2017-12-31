import Vue from 'vue'

describe('Instance properties', () => {
  it('$data', () => {
    const data = { a: 1 }
    const vm = new Vue({
      data
    })
    expect(vm.a).toBe(1)
    expect(vm.$data).toBe(data)
    // vm -> data
    vm.a = 2
    expect(data.a).toBe(2)
    // data -> vm
    data.a = 3
    expect(vm.a).toBe(3)
  })

  it('$options', () => {
    const A = Vue.extend({
      methods: {
        a () {}
      }
    })
    const vm = new A({
      methods: {
        b () {}
      }
    })
    expect(typeof vm.$options.methods.a).toBe('function')
    expect(typeof vm.$options.methods.b).toBe('function')
  })

  it('$root/$children', done => {
    const vm = new Vue({
      template: '<div><test v-if="ok"></test></div>',
      data: { ok: true },
      components: {
        test: {
          template: '<div></div>'
        }
      }
    }).$mount()
    expect(vm.$root).toBe(vm)
    expect(vm.$children.length).toBe(1)
    expect(vm.$children[0].$root).toBe(vm)
    vm.ok = false
    waitForUpdate(() => {
      expect(vm.$children.length).toBe(0)
      vm.ok = true
    }).then(() => {
      expect(vm.$children.length).toBe(1)
      expect(vm.$children[0].$root).toBe(vm)
    }).then(done)
  })

  it('$parent', () => {
    const calls = []
    const makeOption = name => ({
      name,
      template: `<div><slot></slot></div>`,
      created () {
        calls.push(`${name}:${this.$parent.$options.name}`)
      }
    })
    new Vue({
      template: `
        <div>
          <outer><middle><inner></inner></middle></outer>
          <next></next>
        </div>
      `,
      components: {
        outer: makeOption('outer'),
        middle: makeOption('middle'),
        inner: makeOption('inner'),
        next: makeOption('next')
      }
    }).$mount()
    expect(calls).toEqual(['outer:undefined', 'middle:outer', 'inner:middle', 'next:undefined'])
  })

  it('$props', done => {
    const Comp = Vue.extend({
      props: ['msg'],
      template: '<div>{{ msg }} {{ $props.msg }}</div>'
    })
    const vm = new Comp({
      propsData: {
        msg: 'foo'
      }
    }).$mount()
    // check render
    expect(vm.$el.textContent).toContain('foo foo')
    // warn set
    vm.$props = {}
    expect('$props is readonly').toHaveBeenWarned()
    // check existence
    expect(vm.$props.msg).toBe('foo')
    // check change
    vm.msg = 'bar'
    expect(vm.$props.msg).toBe('bar')
    waitForUpdate(() => {
      expect(vm.$el.textContent).toContain('bar bar')
    }).then(() => {
      vm.$props.msg = 'baz'
      expect(vm.msg).toBe('baz')
    }).then(() => {
      expect(vm.$el.textContent).toContain('baz baz')
    }).then(done)
  })

  it('warn mutating $props', () => {
    const Comp = {
      props: ['msg'],
      render () {},
      mounted () {
        expect(this.$props.msg).toBe('foo')
        this.$props.msg = 'bar'
      }
    }
    new Vue({
      template: `<comp ref="comp" msg="foo" />`,
      components: { Comp }
    }).$mount()
    expect(`Avoid mutating a prop`).toHaveBeenWarned()
  })

  it('$attrs', done => {
    const vm = new Vue({
      template: `<foo :id="foo" bar="1"/>`,
      data: { foo: 'foo' },
      components: {
        foo: {
          props: ['bar'],
          template: `<div><div v-bind="$attrs"></div></div>`
        }
      }
    }).$mount()
    expect(vm.$el.children[0].id).toBe('foo')
    expect(vm.$el.children[0].hasAttribute('bar')).toBe(false)
    vm.foo = 'bar'
    waitForUpdate(() => {
      expect(vm.$el.children[0].id).toBe('bar')
      expect(vm.$el.children[0].hasAttribute('bar')).toBe(false)
    }).then(done)
  })

  // #6263
  it('$attrs should not be undefined when no props passed in', () => {
    const vm = new Vue({
      template: `<foo/>`,
      data: { foo: 'foo' },
      components: {
        foo: {
          template: `<div>{{ this.foo }}</div>`
        }
      }
    }).$mount()
    expect(vm.$attrs).toBeDefined()
  })

  it('warn mutating $attrs', () => {
    const vm = new Vue()
    vm.$attrs = {}
    expect(`$attrs is readonly`).toHaveBeenWarned()
  })

  it('$listeners', done => {
    const spyA = jasmine.createSpy('A')
    const spyB = jasmine.createSpy('B')
    const vm = new Vue({
      template: `<foo @click="foo"/>`,
      data: { foo: spyA },
      components: {
        foo: {
          template: `<div v-on="$listeners"></div>`
        }
      }
    }).$mount()

    // has to be in dom for test to pass in IE
    document.body.appendChild(vm.$el)

    triggerEvent(vm.$el, 'click')
    expect(spyA.calls.count()).toBe(1)
    expect(spyB.calls.count()).toBe(0)

    vm.foo = spyB
    waitForUpdate(() => {
      triggerEvent(vm.$el, 'click')
      expect(spyA.calls.count()).toBe(1)
      expect(spyB.calls.count()).toBe(1)
      document.body.removeChild(vm.$el)
    }).then(done)
  })

  it('warn mutating $listeners', () => {
    const vm = new Vue()
    vm.$listeners = {}
    expect(`$listeners is readonly`).toHaveBeenWarned()
  })
})
