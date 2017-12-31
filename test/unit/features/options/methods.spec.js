import Vue from 'vue'
import testObjectOption from '../../../helpers/test-object-option'

describe('Options methods', () => {
  testObjectOption('methods')

  it('should have correct context', () => {
    const vm = new Vue({
      data: {
        a: 1
      },
      methods: {
        plus () {
          this.a++
        }
      }
    })
    vm.plus()
    expect(vm.a).toBe(2)
  })

  it('should warn undefined methods', () => {
    new Vue({
      methods: {
        hello: undefined
      }
    })
    expect(`Method "hello" has an undefined value in the component definition`).toHaveBeenWarned()
  })

  it('should warn methods conflicting with data', () => {
    new Vue({
      data: {
        foo: 1
      },
      methods: {
        foo () {}
      }
    })
    expect(`Method "foo" has already been defined as a data property`).toHaveBeenWarned()
  })

  it('should warn methods conflicting with internal methods', () => {
    new Vue({
      methods: {
        _update () {}
      }
    })
    expect(`Method "_update" conflicts with an existing Vue instance method`).toHaveBeenWarned()
  })
})
