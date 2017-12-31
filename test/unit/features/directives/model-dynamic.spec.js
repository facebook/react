import Vue from 'vue'

describe('Directive v-model dynamic input type', () => {
  it('should work', done => {
    const vm = new Vue({
      data: {
        inputType: null,
        test: 'b'
      },
      template: `<input :type="inputType" v-model="test">`
    }).$mount()
    document.body.appendChild(vm.$el)

    // test text
    assertInputWorks(vm, 'inputType').then(done)
  })

  it('with v-if', done => {
    const vm = new Vue({
      data: {
        ok: true,
        type: null,
        test: 'b'
      },
      template: `<input v-if="ok" :type="type" v-model="test"><div v-else>haha</div>`
    }).$mount()
    document.body.appendChild(vm.$el)

    const chain = assertInputWorks(vm).then(() => {
      vm.ok = false
    }).then(() => {
      expect(vm.$el.textContent).toBe('haha')
    }).then(() => {
      // reset
      vm.ok = true
      vm.type = null
      vm.test = 'b'
    })

    assertInputWorks(vm, chain).then(done)
  })

  it('with v-else', done => {
    const data = {
      ok: true,
      type: null,
      test: 'b'
    }
    const vm = new Vue({
      data,
      template: `<div v-if="ok">haha</div><input v-else :type="type" v-model="test">`
    }).$mount()
    document.body.appendChild(vm.$el)
    expect(vm.$el.textContent).toBe('haha')

    vm.ok = false
    assertInputWorks(vm).then(done)
  })

  it('with v-else-if', done => {
    const vm = new Vue({
      data: {
        foo: true,
        bar: false,
        type: null,
        test: 'b'
      },
      template: `<div v-if="foo">text</div><input v-else-if="bar" :type="type" v-model="test">`
    }).$mount()
    document.body.appendChild(vm.$el)

    const chain = waitForUpdate(() => {
      expect(vm.$el.textContent).toBe('text')
    }).then(() => {
      vm.foo = false
    }).then(() => {
      expect(vm._vnode.isComment).toBe(true)
    }).then(() => {
      vm.bar = true
    })

    assertInputWorks(vm, chain).then(done)
  })

  it('with v-for', done => {
    const vm = new Vue({
      data: {
        data: {
          text: 'foo',
          checkbox: true
        },
        types: ['text', 'checkbox']
      },
      template: `<div>
        <input v-for="type in types" :type="type" v-model="data[type]">
      </div>`
    }).$mount()
    document.body.appendChild(vm.$el)

    let el1 = vm.$el.children[0]
    expect(el1.type).toBe('text')
    expect(el1.value).toBe('foo')
    el1.value = 'bar'
    triggerEvent(el1, 'input')
    expect(vm.data.text).toBe('bar')

    let el2 = vm.$el.children[1]
    expect(el2.type).toBe('checkbox')
    expect(el2.checked).toBe(true)
    el2.click()
    expect(vm.data.checkbox).toBe(false)

    // now in reverse!
    vm.types.reverse()
    waitForUpdate(() => {
      el1 = vm.$el.children[0]
      expect(el1.type).toBe('checkbox')
      expect(el1.checked).toBe(false)
      el1.click()
      expect(vm.data.checkbox).toBe(true)

      el2 = vm.$el.children[1]
      expect(el2.type).toBe('text')
      expect(el2.value).toBe('bar')
      el2.value = 'foo'
      triggerEvent(el2, 'input')
      expect(vm.data.text).toBe('foo')
    }).then(done)
  })

  it('with v-bind', done => {
    const vm = new Vue({
      data: {
        data: {
          text: 'foo',
          checkbox: true
        },
        inputs: [{ id: 'one', type: 'text' }, { id: 'two', type: 'checkbox' }]
      },
      template: `<div>
        <input v-for="i in inputs" v-bind="i" v-model="data[i.type]">
      </div>`
    }).$mount()
    document.body.appendChild(vm.$el)

    let el1 = vm.$el.children[0]
    expect(el1.id).toBe('one')
    expect(el1.type).toBe('text')
    expect(el1.value).toBe('foo')
    el1.value = 'bar'
    triggerEvent(el1, 'input')
    expect(vm.data.text).toBe('bar')

    let el2 = vm.$el.children[1]
    expect(el2.id).toBe('two')
    expect(el2.type).toBe('checkbox')
    expect(el2.checked).toBe(true)
    el2.click()
    expect(vm.data.checkbox).toBe(false)

    // now in reverse!
    vm.inputs.reverse()
    waitForUpdate(() => {
      el1 = vm.$el.children[0]
      expect(el1.id).toBe('two')
      expect(el1.type).toBe('checkbox')
      expect(el1.checked).toBe(false)
      el1.click()
      expect(vm.data.checkbox).toBe(true)

      el2 = vm.$el.children[1]
      expect(el2.id).toBe('one')
      expect(el2.type).toBe('text')
      expect(el2.value).toBe('bar')
      el2.value = 'foo'
      triggerEvent(el2, 'input')
      expect(vm.data.text).toBe('foo')
    }).then(done)
  })
})

function assertInputWorks (vm, type, chain) {
  if (typeof type !== 'string') {
    if (!chain) chain = type
    type = 'type'
  }
  if (!chain) chain = waitForUpdate()
  chain.then(() => {
    expect(vm.$el.value).toBe('b')
    vm.test = 'a'
  }).then(() => {
    expect(vm.$el.value).toBe('a')
    vm.$el.value = 'c'
    triggerEvent(vm.$el, 'input')
    expect(vm.test).toBe('c')
  }).then(() => {
    // change it to password
    vm[type] = 'password'
    vm.test = 'b'
  }).then(() => {
    expect(vm.$el.type).toBe('password')
    expect(vm.$el.value).toBe('b')
    vm.$el.value = 'c'
    triggerEvent(vm.$el, 'input')
    expect(vm.test).toBe('c')
  }).then(() => {
    // change it to checkbox...
    vm[type] = 'checkbox'
  }).then(() => {
    expect(vm.$el.type).toBe('checkbox')
    expect(vm.$el.checked).toBe(true)
  }).then(() => {
    vm.$el.click()
    expect(vm.$el.checked).toBe(false)
    expect(vm.test).toBe(false)
  })
  return chain
}
