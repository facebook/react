import Vue from 'vue'

describe('Global API: extend', () => {
  it('should correctly merge options', () => {
    const Test = Vue.extend({
      name: 'test',
      a: 1,
      b: 2
    })
    expect(Test.options.a).toBe(1)
    expect(Test.options.b).toBe(2)
    expect(Test.super).toBe(Vue)
    const t = new Test({
      a: 2
    })
    expect(t.$options.a).toBe(2)
    expect(t.$options.b).toBe(2)
    // inheritance
    const Test2 = Test.extend({
      a: 2
    })
    expect(Test2.options.a).toBe(2)
    expect(Test2.options.b).toBe(2)
    const t2 = new Test2({
      a: 3
    })
    expect(t2.$options.a).toBe(3)
    expect(t2.$options.b).toBe(2)
  })

  it('should warn invalid names', () => {
    Vue.extend({ name: '123' })
    expect('Invalid component name: "123"').toHaveBeenWarned()
    Vue.extend({ name: '_fesf' })
    expect('Invalid component name: "_fesf"').toHaveBeenWarned()
    Vue.extend({ name: 'Some App' })
    expect('Invalid component name: "Some App"').toHaveBeenWarned()
  })

  it('should work when used as components', () => {
    const foo = Vue.extend({
      template: '<span>foo</span>'
    })
    const bar = Vue.extend({
      template: '<span>bar</span>'
    })
    const vm = new Vue({
      template: '<div><foo></foo><bar></bar></div>',
      components: { foo, bar }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>foo</span><span>bar</span>')
  })

  it('should merge lifecycle hooks', () => {
    const calls = []
    const A = Vue.extend({
      created () {
        calls.push(1)
      }
    })
    const B = A.extend({
      created () {
        calls.push(2)
      }
    })
    new B({
      created () {
        calls.push(3)
      }
    })
    expect(calls).toEqual([1, 2, 3])
  })

  it('should merge methods', () => {
    const A = Vue.extend({
      methods: {
        a () { return this.n }
      }
    })
    const B = A.extend({
      methods: {
        b () { return this.n + 1 }
      }
    })
    const b = new B({
      data: { n: 0 },
      methods: {
        c () { return this.n + 2 }
      }
    })
    expect(b.a()).toBe(0)
    expect(b.b()).toBe(1)
    expect(b.c()).toBe(2)
  })

  it('should merge assets', () => {
    const A = Vue.extend({
      components: {
        aa: {
          template: '<div>A</div>'
        }
      }
    })
    const B = A.extend({
      components: {
        bb: {
          template: '<div>B</div>'
        }
      }
    })
    const b = new B({
      template: '<div><aa></aa><bb></bb></div>'
    }).$mount()
    expect(b.$el.innerHTML).toBe('<div>A</div><div>B</div>')
  })

  it('caching', () => {
    const options = {
      template: '<div></div>'
    }
    const A = Vue.extend(options)
    const B = Vue.extend(options)
    expect(A).toBe(B)
  })

  // #4767
  it('extended options should use different identify from parent', () => {
    const A = Vue.extend({ computed: {}})
    const B = A.extend()
    B.options.computed.b = () => 'foo'
    expect(B.options.computed).not.toBe(A.options.computed)
    expect(A.options.computed.b).toBeUndefined()
  })
})
