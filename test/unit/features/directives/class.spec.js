import Vue from 'vue'

function assertClass (assertions, done) {
  const vm = new Vue({
    template: '<div class="foo" :class="value"></div>',
    data: { value: '' }
  }).$mount()
  var chain = waitForUpdate()
  assertions.forEach(([value, expected], i) => {
    chain.then(() => {
      if (typeof value === 'function') {
        value(vm.value)
      } else {
        vm.value = value
      }
    }).then(() => {
      expect(vm.$el.className).toBe(expected)
      if (i >= assertions.length - 1) {
        done()
      }
    })
  })
  chain.then(done)
}

describe('Directive v-bind:class', () => {
  it('plain string', done => {
    assertClass([
      ['bar', 'foo bar'],
      ['baz qux', 'foo baz qux'],
      ['qux', 'foo qux'],
      [undefined, 'foo']
    ], done)
  })

  it('object value', done => {
    assertClass([
      [{ bar: true, baz: false }, 'foo bar'],
      [{ baz: true }, 'foo baz'],
      [null, 'foo'],
      [{ 'bar baz': true, qux: false }, 'foo bar baz'],
      [{ qux: true }, 'foo qux']
    ], done)
  })

  it('array value', done => {
    assertClass([
      [['bar', 'baz'], 'foo bar baz'],
      [['qux', 'baz'], 'foo qux baz'],
      [['w', 'x y z'], 'foo w x y z'],
      [undefined, 'foo'],
      [['bar'], 'foo bar'],
      [val => val.push('baz'), 'foo bar baz']
    ], done)
  })

  it('array of mixed values', done => {
    assertClass([
      [['x', { y: true, z: true }], 'foo x y z'],
      [['x', { y: true, z: false }], 'foo x y'],
      [['f', { z: true }], 'foo f z'],
      [['l', 'f', { n: true, z: true }], 'foo l f n z'],
      [['x', {}], 'foo x'],
      [undefined, 'foo']
    ], done)
  })

  it('class merge between parent and child', done => {
    const vm = new Vue({
      template: '<child class="a" :class="value"></child>',
      data: { value: 'b' },
      components: {
        child: {
          template: '<div class="c" :class="value"></div>',
          data: () => ({ value: 'd' })
        }
      }
    }).$mount()
    const child = vm.$children[0]
    expect(vm.$el.className).toBe('c a d b')
    vm.value = 'e'
    waitForUpdate(() => {
      expect(vm.$el.className).toBe('c a d e')
    }).then(() => {
      child.value = 'f'
    }).then(() => {
      expect(vm.$el.className).toBe('c a f e')
    }).then(() => {
      vm.value = { foo: true }
      child.value = ['bar', 'baz']
    }).then(() => {
      expect(vm.$el.className).toBe('c a bar baz foo')
    }).then(done)
  })

  it('class merge between multiple nested components sharing same element', done => {
    const vm = new Vue({
      template: `
        <component1 :class="componentClass1">
          <component2 :class="componentClass2">
            <component3 :class="componentClass3">
              some text
            </component3>
          </component2>
        </component1>
      `,
      data: {
        componentClass1: 'componentClass1',
        componentClass2: 'componentClass2',
        componentClass3: 'componentClass3'
      },
      components: {
        component1: {
          render () {
            return this.$slots.default[0]
          }
        },
        component2: {
          render () {
            return this.$slots.default[0]
          }
        },
        component3: {
          template: '<div class="staticClass"><slot></slot></div>'
        }
      }
    }).$mount()
    expect(vm.$el.className).toBe('staticClass componentClass3 componentClass2 componentClass1')
    vm.componentClass1 = 'c1'
    waitForUpdate(() => {
      expect(vm.$el.className).toBe('staticClass componentClass3 componentClass2 c1')
      vm.componentClass2 = 'c2'
    }).then(() => {
      expect(vm.$el.className).toBe('staticClass componentClass3 c2 c1')
      vm.componentClass3 = 'c3'
    }).then(() => {
      expect(vm.$el.className).toBe('staticClass c3 c2 c1')
    }).then(done)
  })

  it('deep update', done => {
    const vm = new Vue({
      template: '<div :class="test"></div>',
      data: {
        test: { a: true, b: false }
      }
    }).$mount()
    expect(vm.$el.className).toBe('a')
    vm.test.b = true
    waitForUpdate(() => {
      expect(vm.$el.className).toBe('a b')
    }).then(done)
  })

  // a vdom patch edge case where the user has several un-keyed elements of the
  // same tag next to each other, and toggling them.
  it('properly remove staticClass for toggling un-keyed children', done => {
    const vm = new Vue({
      template: `
        <div>
          <div v-if="ok" class="a"></div>
          <div v-if="!ok"></div>
        </div>
      `,
      data: {
        ok: true
      }
    }).$mount()
    expect(vm.$el.children[0].className).toBe('a')
    vm.ok = false
    waitForUpdate(() => {
      expect(vm.$el.children[0].className).toBe('')
    }).then(done)
  })
})
