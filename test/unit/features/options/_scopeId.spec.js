import Vue from 'vue'

describe('Options _scopeId', () => {
  it('should add scopeId attributes', () => {
    const vm = new Vue({
      _scopeId: 'foo',
      template: '<div><p><span></span></p></div>'
    }).$mount()
    expect(vm.$el.hasAttribute('foo')).toBe(true)
    expect(vm.$el.children[0].hasAttribute('foo')).toBe(true)
    expect(vm.$el.children[0].children[0].hasAttribute('foo')).toBe(true)
  })

  it('should add scopedId attributes from both parent and child on child root', () => {
    const vm = new Vue({
      _scopeId: 'foo',
      template: '<div><child></child></div>',
      components: {
        child: {
          _scopeId: 'bar',
          template: '<div></div>'
        }
      }
    }).$mount()
    expect(vm.$el.children[0].hasAttribute('foo')).toBe(true)
    expect(vm.$el.children[0].hasAttribute('bar')).toBe(true)
  })

  it('should add scopedId attributes from both parent and child on slot contents', () => {
    const vm = new Vue({
      _scopeId: 'foo',
      template: '<div><child><p>hi</p></child></div>',
      components: {
        child: {
          _scopeId: 'bar',
          template: '<div><slot></slot></div>'
        }
      }
    }).$mount()
    expect(vm.$el.children[0].children[0].hasAttribute('foo')).toBe(true)
    expect(vm.$el.children[0].children[0].hasAttribute('bar')).toBe(true)
  })

  // #4774
  it('should not discard parent scopeId when component root element is replaced', done => {
    const vm = new Vue({
      _scopeId: 'data-1',
      template: `<div><child ref="child" /></div>`,
      components: {
        child: {
          _scopeId: 'data-2',
          data: () => ({ show: true }),
          template: '<div v-if="show"></div>'
        }
      }
    }).$mount()

    const child = vm.$refs.child

    expect(child.$el.hasAttribute('data-1')).toBe(true)
    expect(child.$el.hasAttribute('data-2')).toBe(true)

    child.show = false
    waitForUpdate(() => {
      child.show = true
    }).then(() => {
      expect(child.$el.hasAttribute('data-1')).toBe(true)
      expect(child.$el.hasAttribute('data-2')).toBe(true)
    }).then(done)
  })

  it('should work on functional components', () => {
    const child = {
      functional: true,
      _scopeId: 'child',
      render (h) {
        return h('div', { class: 'child' }, [
          h('span', { class: 'child' }, 'child')
        ])
      }
    }
    const vm = new Vue({
      _scopeId: 'parent',
      components: { child },
      template: '<div><child></child></div>'
    }).$mount()

    expect(vm.$el.hasAttribute('parent')).toBe(true)
    const childEls = vm.$el.querySelectorAll('.child')
    ;[].forEach.call(childEls, el => {
      expect(el.hasAttribute('child')).toBe(true)
      // functional component with scopeId will not inherit parent scopeId
      expect(el.hasAttribute('parent')).toBe(false)
    })
  })
})
