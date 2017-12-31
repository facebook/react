import Vue from 'vue'

describe('Directive v-model component', () => {
  it('should work', done => {
    const vm = new Vue({
      data: {
        msg: 'hello'
      },
      template: `
        <div>
          <p>{{ msg }}</p>
          <test v-model="msg"></test>
        </div>
      `,
      components: {
        test: {
          props: ['value'],
          template: `<input :value="value" @input="$emit('input', $event.target.value)">`
        }
      }
    }).$mount()
    document.body.appendChild(vm.$el)
    waitForUpdate(() => {
      const input = vm.$el.querySelector('input')
      input.value = 'world'
      triggerEvent(input, 'input')
    }).then(() => {
      expect(vm.msg).toEqual('world')
      expect(vm.$el.querySelector('p').textContent).toEqual('world')
      vm.msg = 'changed'
    }).then(() => {
      expect(vm.$el.querySelector('p').textContent).toEqual('changed')
      expect(vm.$el.querySelector('input').value).toEqual('changed')
    }).then(() => {
      document.body.removeChild(vm.$el)
    }).then(done)
  })

  it('should work with native tags with "is"', done => {
    const vm = new Vue({
      data: {
        msg: 'hello'
      },
      template: `
        <div>
          <p>{{ msg }}</p>
          <input is="test" v-model="msg">
        </div>
      `,
      components: {
        test: {
          props: ['value'],
          template: `<input :value="value" @input="$emit('input', $event.target.value)">`
        }
      }
    }).$mount()
    document.body.appendChild(vm.$el)
    waitForUpdate(() => {
      const input = vm.$el.querySelector('input')
      input.value = 'world'
      triggerEvent(input, 'input')
    }).then(() => {
      expect(vm.msg).toEqual('world')
      expect(vm.$el.querySelector('p').textContent).toEqual('world')
      vm.msg = 'changed'
    }).then(() => {
      expect(vm.$el.querySelector('p').textContent).toEqual('changed')
      expect(vm.$el.querySelector('input').value).toEqual('changed')
    }).then(() => {
      document.body.removeChild(vm.$el)
    }).then(done)
  })

  it('should support customization via model option', done => {
    const spy = jasmine.createSpy('update')
    const vm = new Vue({
      data: {
        msg: 'hello'
      },
      methods: {
        spy
      },
      template: `
        <div>
          <p>{{ msg }}</p>
          <test v-model="msg" @update="spy"></test>
        </div>
      `,
      components: {
        test: {
          model: {
            prop: 'currentValue',
            event: 'update'
          },
          props: ['currentValue'],
          template: `<input :value="currentValue" @input="$emit('update', $event.target.value)">`
        }
      }
    }).$mount()
    document.body.appendChild(vm.$el)
    waitForUpdate(() => {
      const input = vm.$el.querySelector('input')
      input.value = 'world'
      triggerEvent(input, 'input')
    }).then(() => {
      expect(vm.msg).toEqual('world')
      expect(vm.$el.querySelector('p').textContent).toEqual('world')
      expect(spy).toHaveBeenCalledWith('world')
      vm.msg = 'changed'
    }).then(() => {
      expect(vm.$el.querySelector('p').textContent).toEqual('changed')
      expect(vm.$el.querySelector('input').value).toEqual('changed')
    }).then(() => {
      document.body.removeChild(vm.$el)
    }).then(done)
  })

  it('modifier: .number', () => {
    const vm = new Vue({
      template: `<div><my-input ref="input" v-model.number="text"></my-input></div>`,
      data: { text: 'foo' },
      components: {
        'my-input': {
          template: '<input>'
        }
      }
    }).$mount()
    expect(vm.text).toBe('foo')
    vm.$refs.input.$emit('input', 'bar')
    expect(vm.text).toBe('bar')
    vm.$refs.input.$emit('input', '123')
    expect(vm.text).toBe(123)
  })

  it('modifier: .trim', () => {
    const vm = new Vue({
      template: `<div><my-input ref="input" v-model.trim="text"></my-input></div>`,
      data: { text: 'foo' },
      components: {
        'my-input': {
          template: '<input>'
        }
      }
    }).$mount()
    expect(vm.text).toBe('foo')
    vm.$refs.input.$emit('input', '  bar  ')
    expect(vm.text).toBe('bar')
    vm.$refs.input.$emit('input', '   foo o  ')
    expect(vm.text).toBe('foo o')
  })
})
