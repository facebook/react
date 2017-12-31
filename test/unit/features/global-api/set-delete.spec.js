import Vue from 'vue'

describe('Global API: set/delete', () => {
  describe('Vue.set', () => {
    it('should update a vue object', done => {
      const vm = new Vue({
        template: '<div>{{x}}</div>',
        data: { x: 1 }
      }).$mount()
      expect(vm.$el.innerHTML).toBe('1')
      Vue.set(vm, 'x', 2)
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe('2')
      }).then(done)
    })

    it('should update a observing object', done => {
      const vm = new Vue({
        template: '<div>{{foo.x}}</div>',
        data: { foo: { x: 1 }}
      }).$mount()
      expect(vm.$el.innerHTML).toBe('1')
      Vue.set(vm.foo, 'x', 2)
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe('2')
      }).then(done)
    })

    it('should update a observing array', done => {
      const vm = new Vue({
        template: '<div><div v-for="v,k in list">{{k}}-{{v}}</div></div>',
        data: { list: ['a', 'b', 'c'] }
      }).$mount()
      expect(vm.$el.innerHTML).toBe('<div>0-a</div><div>1-b</div><div>2-c</div>')
      Vue.set(vm.list, 1, 'd')
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe('<div>0-a</div><div>1-d</div><div>2-c</div>')
        Vue.set(vm.list, '2', 'e')
      }).then(() => {
        expect(vm.$el.innerHTML).toBe('<div>0-a</div><div>1-d</div><div>2-e</div>')
        /* eslint-disable no-new-wrappers */
        Vue.set(vm.list, new Number(1), 'f')
      }).then(() => {
        expect(vm.$el.innerHTML).toBe('<div>0-a</div><div>1-f</div><div>2-e</div>')
        Vue.set(vm.list, '3g', 'g')
      }).then(() => {
        expect(vm.$el.innerHTML).toBe('<div>0-a</div><div>1-f</div><div>2-e</div>')
      }).then(done)
    })

    it('should update a vue object with nothing', done => {
      const vm = new Vue({
        template: '<div>{{x}}</div>',
        data: { x: 1 }
      }).$mount()
      expect(vm.$el.innerHTML).toBe('1')
      Vue.set(vm, 'x', null)
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe('')
        Vue.set(vm, 'x')
      }).then(() => {
        expect(vm.$el.innerHTML).toBe('')
      }).then(done)
    })

    it('be able to use string type index in array', done => {
      const vm = new Vue({
        template: '<div><p v-for="obj in lists">{{obj.name}}</p></div>',
        data: {
          lists: [
            { name: 'A' },
            { name: 'B' },
            { name: 'C' }
          ]
        }
      }).$mount()
      expect(vm.$el.innerHTML).toBe('<p>A</p><p>B</p><p>C</p>')
      Vue.set(vm.lists, '0', { name: 'D' })
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe('<p>D</p><p>B</p><p>C</p>')
      }).then(done)
    })

    // #6845
    it('should not overwrite properties on prototype chain', () => {
      class Model {
        constructor () {
          this._bar = null
        }
        get bar () {
          return this._bar
        }
        set bar (newvalue) {
          this._bar = newvalue
        }
      }

      const vm = new Vue({
        data: {
          data: new Model()
        }
      })

      Vue.set(vm.data, 'bar', 123)
      expect(vm.data.bar).toBe(123)
      expect(vm.data.hasOwnProperty('bar')).toBe(false)
      expect(vm.data._bar).toBe(123)
    })
  })

  describe('Vue.delete', () => {
    it('should delete a key', done => {
      const vm = new Vue({
        template: '<div>{{obj.x}}</div>',
        data: { obj: { x: 1 }}
      }).$mount()
      expect(vm.$el.innerHTML).toBe('1')
      vm.obj.x = 2
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe('2')
        Vue.delete(vm.obj, 'x')
      }).then(() => {
        expect(vm.$el.innerHTML).toBe('')
        vm.obj.x = 3
      }).then(() => {
        expect(vm.$el.innerHTML).toBe('')
      }).then(done)
    })

    it('be able to delete an item in array', done => {
      const vm = new Vue({
        template: '<div><p v-for="obj in lists">{{obj.name}}</p></div>',
        data: {
          lists: [
            { name: 'A' },
            { name: 'B' },
            { name: 'C' }
          ]
        }
      }).$mount()
      expect(vm.$el.innerHTML).toBe('<p>A</p><p>B</p><p>C</p>')
      Vue.delete(vm.lists, 1)
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe('<p>A</p><p>C</p>')
        Vue.delete(vm.lists, NaN)
      }).then(() => {
        expect(vm.$el.innerHTML).toBe('<p>A</p><p>C</p>')
        Vue.delete(vm.lists, -1)
      }).then(() => {
        expect(vm.$el.innerHTML).toBe('<p>A</p><p>C</p>')
        Vue.delete(vm.lists, '1.3')
      }).then(() => {
        expect(vm.$el.innerHTML).toBe('<p>A</p><p>C</p>')
        Vue.delete(vm.lists, true)
      }).then(() => {
        expect(vm.$el.innerHTML).toBe('<p>A</p><p>C</p>')
        Vue.delete(vm.lists, {})
      }).then(() => {
        expect(vm.$el.innerHTML).toBe('<p>A</p><p>C</p>')
        Vue.delete(vm.lists, '1')
      }).then(() => {
        expect(vm.$el.innerHTML).toBe('<p>A</p>')
        /* eslint-disable no-new-wrappers */
        Vue.delete(vm.lists, new Number(0))
      }).then(() => {
        expect(vm.$el.innerHTML).toBe('')
      }).then(done)
    })
  })
})
