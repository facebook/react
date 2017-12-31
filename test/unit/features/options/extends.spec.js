import Vue from 'vue'
import { nativeWatch } from 'core/util/env'

describe('Options extends', () => {
  it('should work on objects', () => {
    const A = {
      data () {
        return { a: 1 }
      }
    }
    const B = {
      extends: A,
      data () {
        return { b: 2 }
      }
    }
    const vm = new Vue({
      extends: B,
      data: {
        c: 3
      }
    })
    expect(vm.a).toBe(1)
    expect(vm.b).toBe(2)
    expect(vm.c).toBe(3)
  })

  it('should work on extended constructors', () => {
    const A = Vue.extend({
      data () {
        return { a: 1 }
      }
    })
    const B = Vue.extend({
      extends: A,
      data () {
        return { b: 2 }
      }
    })
    const vm = new Vue({
      extends: B,
      data: {
        c: 3
      }
    })
    expect(vm.a).toBe(1)
    expect(vm.b).toBe(2)
    expect(vm.c).toBe(3)
  })

  if (nativeWatch) {
    it('should work with global mixins + Object.prototype.watch', done => {
      Vue.mixin({})

      const spy = jasmine.createSpy('watch')
      const A = Vue.extend({
        data: function () {
          return { a: 1 }
        },
        watch: {
          a: spy
        },
        created: function () {
          this.a = 2
        }
      })
      new Vue({
        extends: A
      })
      waitForUpdate(() => {
        expect(spy).toHaveBeenCalledWith(2, 1)
      }).then(done)
    })
  }
})
