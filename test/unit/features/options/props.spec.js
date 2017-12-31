import Vue from 'vue'
import { hasSymbol } from 'core/util/env'
import testObjectOption from '../../../helpers/test-object-option'

describe('Options props', () => {
  testObjectOption('props')

  it('array syntax', done => {
    const vm = new Vue({
      data: {
        b: 'bar'
      },
      template: '<test v-bind:b="b" ref="child"></test>',
      components: {
        test: {
          props: ['b'],
          template: '<div>{{b}}</div>'
        }
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('bar')
    vm.b = 'baz'
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('baz')
      vm.$refs.child.b = 'qux'
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('qux')
      expect('Avoid mutating a prop directly').toHaveBeenWarned()
    }).then(done)
  })

  it('object syntax', done => {
    const vm = new Vue({
      data: {
        b: 'bar'
      },
      template: '<test v-bind:b="b" ref="child"></test>',
      components: {
        test: {
          props: { b: String },
          template: '<div>{{b}}</div>'
        }
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('bar')
    vm.b = 'baz'
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('baz')
      vm.$refs.child.b = 'qux'
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('qux')
      expect('Avoid mutating a prop directly').toHaveBeenWarned()
    }).then(done)
  })

  it('warn mixed syntax', () => {
    new Vue({
      props: [{ b: String }]
    })
    expect('props must be strings when using array syntax').toHaveBeenWarned()
  })

  it('default values', () => {
    const vm = new Vue({
      data: {
        b: undefined
      },
      template: '<test :b="b"></test>',
      components: {
        test: {
          props: {
            a: {
              default: 'A' // absent
            },
            b: {
              default: 'B' // undefined
            }
          },
          template: '<div>{{a}}{{b}}</div>'
        }
      }
    }).$mount()
    expect(vm.$el.textContent).toBe('AB')
  })

  it('default value reactivity', done => {
    const vm = new Vue({
      props: {
        a: {
          default: () => ({ b: 1 })
        }
      },
      propsData: {
        a: undefined
      },
      template: '<div>{{ a.b }}</div>'
    }).$mount()
    expect(vm.$el.textContent).toBe('1')
    vm.a.b = 2
    waitForUpdate(() => {
      expect(vm.$el.textContent).toBe('2')
    }).then(done)
  })

  it('default value Function', () => {
    const func = () => 132
    const vm = new Vue({
      props: {
        a: {
          type: Function,
          default: func
        }
      },
      propsData: {
        a: undefined
      }
    })
    expect(vm.a).toBe(func)
  })

  it('warn object/array default values', () => {
    new Vue({
      props: {
        a: {
          default: { b: 1 }
        }
      },
      propsData: {
        a: undefined
      }
    })
    expect('Props with type Object/Array must use a factory function').toHaveBeenWarned()
  })

  it('warn missing required', () => {
    new Vue({
      template: '<test></test>',
      components: {
        test: {
          props: { a: { required: true }},
          template: '<div>{{a}}</div>'
        }
      }
    }).$mount()
    expect('Missing required prop: "a"').toHaveBeenWarned()
  })

  describe('assertions', () => {
    function makeInstance (value, type, validator, required) {
      return new Vue({
        template: '<test :test="val"></test>',
        data: {
          val: value
        },
        components: {
          test: {
            template: '<div></div>',
            props: {
              test: {
                type,
                validator,
                required
              }
            }
          }
        }
      }).$mount()
    }

    it('string', () => {
      makeInstance('hello', String)
      expect(console.error.calls.count()).toBe(0)
      makeInstance(123, String)
      expect('Expected String').toHaveBeenWarned()
    })

    it('number', () => {
      makeInstance(123, Number)
      expect(console.error.calls.count()).toBe(0)
      makeInstance('123', Number)
      expect('Expected Number').toHaveBeenWarned()
    })

    it('boolean', () => {
      makeInstance(true, Boolean)
      expect(console.error.calls.count()).toBe(0)
      makeInstance('123', Boolean)
      expect('Expected Boolean').toHaveBeenWarned()
    })

    it('function', () => {
      makeInstance(() => {}, Function)
      expect(console.error.calls.count()).toBe(0)
      makeInstance(123, Function)
      expect('Expected Function').toHaveBeenWarned()
    })

    it('object', () => {
      makeInstance({}, Object)
      expect(console.error.calls.count()).toBe(0)
      makeInstance([], Object)
      expect('Expected Object').toHaveBeenWarned()
    })

    it('array', () => {
      makeInstance([], Array)
      expect(console.error.calls.count()).toBe(0)
      makeInstance({}, Array)
      expect('Expected Array').toHaveBeenWarned()
    })

    it('primitive wrapper objects', () => {
      /* eslint-disable no-new-wrappers */
      makeInstance(new String('s'), String)
      expect(console.error.calls.count()).toBe(0)
      makeInstance(new Number(1), Number)
      expect(console.error.calls.count()).toBe(0)
      makeInstance(new Boolean(true), Boolean)
      expect(console.error.calls.count()).toBe(0)
      /* eslint-enable no-new-wrappers */
    })

    if (hasSymbol) {
      it('symbol', () => {
        makeInstance(Symbol('foo'), Symbol)
        expect(console.error.calls.count()).toBe(0)
        makeInstance({}, Symbol)
        expect('Expected Symbol').toHaveBeenWarned()
      })
    }

    it('custom constructor', () => {
      function Class () {}
      makeInstance(new Class(), Class)
      expect(console.error.calls.count()).toBe(0)
      makeInstance({}, Class)
      expect('type check failed').toHaveBeenWarned()
    })

    it('multiple types', () => {
      makeInstance([], [Array, Number, Boolean])
      expect(console.error.calls.count()).toBe(0)
      makeInstance({}, [Array, Number, Boolean])
      expect('Expected Array, Number, Boolean, got Object').toHaveBeenWarned()
    })

    it('custom validator', () => {
      makeInstance(123, null, v => v === 123)
      expect(console.error.calls.count()).toBe(0)
      makeInstance(123, null, v => v === 234)
      expect('custom validator check failed').toHaveBeenWarned()
    })

    it('type check + custom validator', () => {
      makeInstance(123, Number, v => v === 123)
      expect(console.error.calls.count()).toBe(0)
      makeInstance(123, Number, v => v === 234)
      expect('custom validator check failed').toHaveBeenWarned()
      makeInstance(123, String, v => v === 123)
      expect('Expected String').toHaveBeenWarned()
    })

    it('multiple types + custom validator', () => {
      makeInstance(123, [Number, String, Boolean], v => v === 123)
      expect(console.error.calls.count()).toBe(0)
      makeInstance(123, [Number, String, Boolean], v => v === 234)
      expect('custom validator check failed').toHaveBeenWarned()
      makeInstance(123, [String, Boolean], v => v === 123)
      expect('Expected String, Boolean').toHaveBeenWarned()
    })

    it('optional with type + null/undefined', () => {
      makeInstance(undefined, String)
      expect(console.error.calls.count()).toBe(0)
      makeInstance(null, String)
      expect(console.error.calls.count()).toBe(0)
    })

    it('required with type + null/undefined', () => {
      makeInstance(undefined, String, null, true)
      expect(console.error.calls.count()).toBe(1)
      expect('Expected String').toHaveBeenWarned()
      makeInstance(null, Boolean, null, true)
      expect(console.error.calls.count()).toBe(2)
      expect('Expected Boolean').toHaveBeenWarned()
    })

    it('optional prop of any type (type: true or prop: true)', () => {
      makeInstance(1, true)
      expect(console.error.calls.count()).toBe(0)
      makeInstance('any', true)
      expect(console.error.calls.count()).toBe(0)
      makeInstance({}, true)
      expect(console.error.calls.count()).toBe(0)
      makeInstance(undefined, true)
      expect(console.error.calls.count()).toBe(0)
      makeInstance(null, true)
      expect(console.error.calls.count()).toBe(0)
    })
  })

  it('should work with v-bind', () => {
    const vm = new Vue({
      template: `<test v-bind="{ a: 1, b: 2 }"></test>`,
      components: {
        test: {
          props: ['a', 'b'],
          template: '<div>{{ a }} {{ b }}</div>'
        }
      }
    }).$mount()
    expect(vm.$el.textContent).toBe('1 2')
  })

  it('should warn data fields already defined as a prop', () => {
    new Vue({
      template: '<test a="1"></test>',
      components: {
        test: {
          template: '<div></div>',
          data: function () {
            return { a: 123 }
          },
          props: {
            a: null
          }
        }
      }
    }).$mount()
    expect('already declared as a prop').toHaveBeenWarned()
  })

  it('should warn methods already defined as a prop', () => {
    new Vue({
      template: '<test a="1"></test>',
      components: {
        test: {
          template: '<div></div>',
          props: {
            a: null
          },
          methods: {
            a () {

            }
          }
        }
      }
    }).$mount()
    expect(`Method "a" has already been defined as a prop`).toHaveBeenWarned()
    expect(`Avoid mutating a prop directly`).toHaveBeenWarned()
  })

  it('treat boolean props properly', () => {
    const vm = new Vue({
      template: '<comp ref="child" prop-a prop-b="prop-b"></comp>',
      components: {
        comp: {
          template: '<div></div>',
          props: {
            propA: Boolean,
            propB: Boolean,
            propC: Boolean
          }
        }
      }
    }).$mount()
    expect(vm.$refs.child.propA).toBe(true)
    expect(vm.$refs.child.propB).toBe(true)
    expect(vm.$refs.child.propC).toBe(false)
  })

  it('should respect default value of a Boolean prop', function () {
    const vm = new Vue({
      template: '<test></test>',
      components: {
        test: {
          props: {
            prop: {
              type: Boolean,
              default: true
            }
          },
          template: '<div>{{prop}}</div>'
        }
      }
    }).$mount()
    expect(vm.$el.textContent).toBe('true')
  })

  it('non reactive values passed down as prop should not be converted', done => {
    const a = Object.freeze({
      nested: {
        msg: 'hello'
      }
    })
    const parent = new Vue({
      template: '<comp :a="a.nested"></comp>',
      data: {
        a: a
      },
      components: {
        comp: {
          template: '<div></div>',
          props: ['a']
        }
      }
    }).$mount()
    const child = parent.$children[0]
    expect(child.a.msg).toBe('hello')
    expect(child.a.__ob__).toBeUndefined() // should not be converted
    parent.a = Object.freeze({
      nested: {
        msg: 'yo'
      }
    })
    waitForUpdate(() => {
      expect(child.a.msg).toBe('yo')
      expect(child.a.__ob__).toBeUndefined()
    }).then(done)
  })

  it('should not warn for non-required, absent prop', function () {
    new Vue({
      template: '<test></test>',
      components: {
        test: {
          template: '<div></div>',
          props: {
            prop: {
              type: String
            }
          }
        }
      }
    }).$mount()
    expect(console.error.calls.count()).toBe(0)
  })

  // #3453
  it('should not fire watcher on object/array props when parent re-renders', done => {
    const spy = jasmine.createSpy()
    const vm = new Vue({
      data: {
        arr: []
      },
      template: '<test :prop="arr">hi</test>',
      components: {
        test: {
          props: ['prop'],
          watch: {
            prop: spy
          },
          template: '<div><slot></slot></div>'
        }
      }
    }).$mount()
    vm.$forceUpdate()
    waitForUpdate(() => {
      expect(spy).not.toHaveBeenCalled()
    }).then(done)
  })

  // #4090
  it('should not trigger watcher on default value', done => {
    const spy = jasmine.createSpy()
    const vm = new Vue({
      template: `<test :value="a" :test="b"></test>`,
      data: {
        a: 1,
        b: undefined
      },
      components: {
        test: {
          template: '<div>{{ value }}</div>',
          props: {
            value: { type: Number },
            test: {
              type: Object,
              default: () => ({})
            }
          },
          watch: {
            test: spy
          }
        }
      }
    }).$mount()

    vm.a++
    waitForUpdate(() => {
      expect(spy).not.toHaveBeenCalled()
      vm.b = {}
    }).then(() => {
      expect(spy.calls.count()).toBe(1)
    }).then(() => {
      vm.b = undefined
    }).then(() => {
      expect(spy.calls.count()).toBe(2)
      vm.a++
    }).then(() => {
      expect(spy.calls.count()).toBe(2)
    }).then(done)
  })

  it('warn reserved props', () => {
    const specialAttrs = ['key', 'ref', 'slot', 'is', 'slot-scope']
    new Vue({
      props: specialAttrs
    })
    specialAttrs.forEach(attr => {
      expect(`"${attr}" is a reserved attribute`).toHaveBeenWarned()
    })
  })
})
