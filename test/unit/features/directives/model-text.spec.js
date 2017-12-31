import Vue from 'vue'
import { isIE9, isIE, isAndroid } from 'core/util/env'

describe('Directive v-model text', () => {
  it('should update value both ways', done => {
    const vm = new Vue({
      data: {
        test: 'b'
      },
      template: '<input v-model="test">'
    }).$mount()
    expect(vm.$el.value).toBe('b')
    vm.test = 'a'
    waitForUpdate(() => {
      expect(vm.$el.value).toBe('a')
      vm.$el.value = 'c'
      triggerEvent(vm.$el, 'input')
      expect(vm.test).toBe('c')
    }).then(done)
  })

  it('.lazy modifier', () => {
    const vm = new Vue({
      data: {
        test: 'b'
      },
      template: '<input v-model.lazy="test">'
    }).$mount()
    expect(vm.$el.value).toBe('b')
    expect(vm.test).toBe('b')
    vm.$el.value = 'c'
    triggerEvent(vm.$el, 'input')
    expect(vm.test).toBe('b')
    triggerEvent(vm.$el, 'change')
    expect(vm.test).toBe('c')
  })

  it('.number modifier', () => {
    const vm = new Vue({
      data: {
        test: 1
      },
      template: '<input v-model.number="test">'
    }).$mount()
    expect(vm.test).toBe(1)
    vm.$el.value = '2'
    triggerEvent(vm.$el, 'input')
    expect(vm.test).toBe(2)
    // should let strings pass through
    vm.$el.value = 'f'
    triggerEvent(vm.$el, 'input')
    expect(vm.test).toBe('f')
  })

  it('.trim modifier', () => {
    const vm = new Vue({
      data: {
        test: 'hi'
      },
      template: '<input v-model.trim="test">'
    }).$mount()
    expect(vm.test).toBe('hi')
    vm.$el.value = ' what '
    triggerEvent(vm.$el, 'input')
    expect(vm.test).toBe('what')
  })

  it('.number focus and typing', (done) => {
    const vm = new Vue({
      data: {
        test: 0,
        update: 0
      },
      template:
        '<div>' +
          '<input ref="input" v-model.number="test">{{ update }}' +
          '<input ref="blur">' +
        '</div>'
    }).$mount()
    document.body.appendChild(vm.$el)
    vm.$refs.input.focus()
    expect(vm.test).toBe(0)
    vm.$refs.input.value = '1.0'
    triggerEvent(vm.$refs.input, 'input')
    expect(vm.test).toBe(1)
    vm.update++
    waitForUpdate(() => {
      expect(vm.$refs.input.value).toBe('1.0')
      vm.$refs.blur.focus()
      vm.update++
    }).then(() => {
      expect(vm.$refs.input.value).toBe('1')
    }).then(done)
  })

  it('.trim focus and typing', (done) => {
    const vm = new Vue({
      data: {
        test: 'abc',
        update: 0
      },
      template:
        '<div>' +
          '<input ref="input" v-model.trim="test" type="text">{{ update }}' +
          '<input ref="blur"/>' +
        '</div>'
    }).$mount()
    document.body.appendChild(vm.$el)
    vm.$refs.input.focus()
    vm.$refs.input.value = ' abc '
    triggerEvent(vm.$refs.input, 'input')
    expect(vm.test).toBe('abc')
    vm.update++
    waitForUpdate(() => {
      expect(vm.$refs.input.value).toBe(' abc ')
      vm.$refs.blur.focus()
      vm.update++
    }).then(() => {
      expect(vm.$refs.input.value).toBe('abc')
    }).then(done)
  })

  it('multiple inputs', (done) => {
    const spy = jasmine.createSpy()
    const vm = new Vue({
      data: {
        selections: [[1, 2, 3], [4, 5]],
        inputList: [
          {
            name: 'questionA',
            data: ['a', 'b', 'c']
          },
          {
            name: 'questionB',
            data: ['1', '2']
          }
        ]
      },
      watch: {
        selections: spy
      },
      template:
        '<div>' +
          '<div v-for="(inputGroup, idx) in inputList">' +
            '<div>' +
              '<span v-for="(item, index) in inputGroup.data">' +
                '<input v-bind:name="item" type="text" v-model.number="selections[idx][index]" v-bind:id="idx+\'-\'+index"/>' +
                '<label>{{item}}</label>' +
              '</span>' +
            '</div>' +
          '</div>' +
          '<span ref="rs">{{selections}}</span>' +
        '</div>'
    }).$mount()
    var inputs = vm.$el.getElementsByTagName('input')
    inputs[1].value = 'test'
    triggerEvent(inputs[1], 'input')
    waitForUpdate(() => {
      expect(spy).toHaveBeenCalled()
      expect(vm.selections).toEqual([[1, 'test', 3], [4, 5]])
    }).then(done)
  })

  if (isIE9) {
    it('IE9 selectionchange', done => {
      const vm = new Vue({
        data: {
          test: 'foo'
        },
        template: '<input v-model="test">'
      }).$mount()
      const input = vm.$el
      input.value = 'bar'
      document.body.appendChild(input)
      input.focus()
      triggerEvent(input, 'selectionchange')
      waitForUpdate(() => {
        expect(vm.test).toBe('bar')
        input.value = 'a'
        triggerEvent(input, 'selectionchange')
        expect(vm.test).toBe('a')
      }).then(done)
    })
  }

  if (!isAndroid) {
    it('compositionevents', function (done) {
      const vm = new Vue({
        data: {
          test: 'foo'
        },
        template: '<input v-model="test">'
      }).$mount()
      const input = vm.$el
      triggerEvent(input, 'compositionstart')
      input.value = 'baz'
      // input before composition unlock should not call set
      triggerEvent(input, 'input')
      expect(vm.test).toBe('foo')
      // after composition unlock it should work
      triggerEvent(input, 'compositionend')
      triggerEvent(input, 'input')
      expect(vm.test).toBe('baz')
      done()
    })
  }

  it('warn invalid tag', () => {
    new Vue({
      data: {
        test: 'foo'
      },
      template: '<div v-model="test"></div>'
    }).$mount()
    expect('<div v-model="test">: v-model is not supported on this element type').toHaveBeenWarned()
  })

  // #3468
  it('should have higher priority than user v-on events', () => {
    const spy = jasmine.createSpy()
    const vm = new Vue({
      data: {
        a: 'a'
      },
      template: '<input v-model="a" @input="onInput">',
      methods: {
        onInput (e) {
          spy(e.target.value)
        }
      }
    }).$mount()
    vm.$el.value = 'b'
    triggerEvent(vm.$el, 'input')
    expect(spy).toHaveBeenCalledWith('b')
  })

  it('warn binding to v-for alias', () => {
    new Vue({
      data: {
        strings: ['hi']
      },
      template: `
        <div>
          <div v-for="str in strings">
            <input v-model="str">
          </div>
        </div>
      `
    }).$mount()
    expect('You are binding v-model directly to a v-for iteration alias').toHaveBeenWarned()
  })

  it('warn if v-model and v-bind:value conflict', () => {
    new Vue({
      data: {
        test: 'foo'
      },
      template: '<input type="text" v-model="test" v-bind:value="test">'
    }).$mount()
    expect('v-bind:value="test" conflicts with v-model').toHaveBeenWarned()
  })

  it('warn if v-model and :value conflict', () => {
    new Vue({
      data: {
        test: 'foo'
      },
      template: '<input type="text" v-model="test" :value="test">'
    }).$mount()
    expect(':value="test" conflicts with v-model').toHaveBeenWarned()
  })

  it('should not warn on radio, checkbox, or custom component', () => {
    new Vue({
      data: { test: '' },
      components: {
        foo: {
          props: ['model', 'value'],
          model: { prop: 'model', event: 'change' },
          template: `<div/>`
        }
      },
      template: `
        <div>
          <input type="checkbox" v-model="test" :value="test">
          <input type="radio" v-model="test" :value="test">
          <foo v-model="test" :value="test"/>
        </div>
      `
    }).$mount()
    expect('conflicts with v-model').not.toHaveBeenWarned()
  })

  if (!isAndroid) {
    it('does not trigger extra input events with single compositionend', () => {
      const spy = jasmine.createSpy()
      const vm = new Vue({
        data: {
          a: 'a'
        },
        template: '<input v-model="a" @input="onInput">',
        methods: {
          onInput (e) {
            spy(e.target.value)
          }
        }
      }).$mount()
      expect(spy.calls.count()).toBe(0)
      vm.$el.value = 'b'
      triggerEvent(vm.$el, 'input')
      expect(spy.calls.count()).toBe(1)
      triggerEvent(vm.$el, 'compositionend')
      expect(spy.calls.count()).toBe(1)
    })

    it('triggers extra input on compositionstart + end', () => {
      const spy = jasmine.createSpy()
      const vm = new Vue({
        data: {
          a: 'a'
        },
        template: '<input v-model="a" @input="onInput">',
        methods: {
          onInput (e) {
            spy(e.target.value)
          }
        }
      }).$mount()
      expect(spy.calls.count()).toBe(0)
      vm.$el.value = 'b'
      triggerEvent(vm.$el, 'input')
      expect(spy.calls.count()).toBe(1)
      triggerEvent(vm.$el, 'compositionstart')
      triggerEvent(vm.$el, 'compositionend')
      expect(spy.calls.count()).toBe(2)
    })

    // #4392
    it('should not update value with modifiers when in focus if post-conversion values are the same', done => {
      const vm = new Vue({
        data: {
          a: 1,
          foo: false
        },
        template: '<div>{{ foo }}<input ref="input" v-model.number="a"></div>'
      }).$mount()

      document.body.appendChild(vm.$el)
      vm.$refs.input.focus()
      vm.$refs.input.value = '1.000'
      vm.foo = true

      waitForUpdate(() => {
        expect(vm.$refs.input.value).toBe('1.000')
      }).then(done)
    })

    // #6552
    // This was original introduced due to the microtask between DOM events issue
    // but fixed after switching to MessageChannel.
    it('should not block input when another input listener with modifier is used', done => {
      const vm = new Vue({
        data: {
          a: 'a',
          foo: false
        },
        template: `
          <div>
            <input ref="input" v-model="a" @input.capture="onInput">{{ a }}
            <div v-if="foo">foo</div>
          </div>
        `,
        methods: {
          onInput (e) {
            this.foo = true
          }
        }
      }).$mount()

      document.body.appendChild(vm.$el)
      vm.$refs.input.focus()
      vm.$refs.input.value = 'b'
      triggerEvent(vm.$refs.input, 'input')

      // not using wait for update here because there will be two update cycles
      // one caused by onInput in the first listener
      setTimeout(() => {
        expect(vm.a).toBe('b')
        expect(vm.$refs.input.value).toBe('b')
        done()
      }, 16)
    })

    it('should create and make reactive non-existent properties', done => {
      const vm = new Vue({
        data: {
          foo: {}
        },
        template: '<input v-model="foo.bar">'
      }).$mount()
      expect(vm.$el.value).toBe('')

      vm.$el.value = 'a'
      triggerEvent(vm.$el, 'input')
      expect(vm.foo.bar).toBe('a')
      vm.foo.bar = 'b'
      waitForUpdate(() => {
        expect(vm.$el.value).toBe('b')
        vm.foo = {}
      }).then(() => {
        expect(vm.$el.value).toBe('')
      }).then(done)
    })
  }

  // #7138
  if (isIE && !isIE9) {
    it('should not fire input on initial render of textarea with placeholder in IE10/11', done => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const vm = new Vue({
        el,
        data: { foo: null },
        template: `<textarea v-model="foo" placeholder="bar"></textarea>`
      })
      setTimeout(() => {
        expect(vm.foo).toBe(null)
        done()
      }, 17)
    })
  }
})
