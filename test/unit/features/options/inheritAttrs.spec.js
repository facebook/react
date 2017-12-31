import Vue from 'vue'

describe('Options inheritAttrs', () => {
  it('should work', done => {
    const vm = new Vue({
      template: `<foo :id="foo"/>`,
      data: { foo: 'foo' },
      components: {
        foo: {
          inheritAttrs: false,
          template: `<div>foo</div>`
        }
      }
    }).$mount()
    expect(vm.$el.id).toBe('')
    vm.foo = 'bar'
    waitForUpdate(() => {
      expect(vm.$el.id).toBe('')
    }).then(done)
  })

  it('with inner v-bind', done => {
    const vm = new Vue({
      template: `<foo :id="foo"/>`,
      data: { foo: 'foo' },
      components: {
        foo: {
          inheritAttrs: false,
          template: `<div><div v-bind="$attrs"></div></div>`
        }
      }
    }).$mount()
    expect(vm.$el.children[0].id).toBe('foo')
    vm.foo = 'bar'
    waitForUpdate(() => {
      expect(vm.$el.children[0].id).toBe('bar')
    }).then(done)
  })
})
