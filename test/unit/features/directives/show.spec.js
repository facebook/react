import Vue from 'vue'

describe('Directive v-show', () => {
  it('should check show value is truthy', () => {
    const vm = new Vue({
      template: '<div><span v-show="foo">hello</span></div>',
      data: { foo: true }
    }).$mount()
    expect(vm.$el.firstChild.style.display).toBe('')
  })

  it('should check show value is falsy', () => {
    const vm = new Vue({
      template: '<div><span v-show="foo">hello</span></div>',
      data: { foo: false }
    }).$mount()
    expect(vm.$el.firstChild.style.display).toBe('none')
  })

  it('should update show value changed', done => {
    const vm = new Vue({
      template: '<div><span v-show="foo">hello</span></div>',
      data: { foo: true }
    }).$mount()
    expect(vm.$el.firstChild.style.display).toBe('')
    vm.foo = false
    waitForUpdate(() => {
      expect(vm.$el.firstChild.style.display).toBe('none')
      vm.foo = {}
    }).then(() => {
      expect(vm.$el.firstChild.style.display).toBe('')
      vm.foo = 0
    }).then(() => {
      expect(vm.$el.firstChild.style.display).toBe('none')
      vm.foo = []
    }).then(() => {
      expect(vm.$el.firstChild.style.display).toBe('')
      vm.foo = null
    }).then(() => {
      expect(vm.$el.firstChild.style.display).toBe('none')
      vm.foo = '0'
    }).then(() => {
      expect(vm.$el.firstChild.style.display).toBe('')
      vm.foo = undefined
    }).then(() => {
      expect(vm.$el.firstChild.style.display).toBe('none')
      vm.foo = 1
    }).then(() => {
      expect(vm.$el.firstChild.style.display).toBe('')
    }).then(done)
  })

  it('should respect display value in style attribute', done => {
    const vm = new Vue({
      template: '<div><span v-show="foo" style="display:block">hello</span></div>',
      data: { foo: true }
    }).$mount()
    expect(vm.$el.firstChild.style.display).toBe('block')
    vm.foo = false
    waitForUpdate(() => {
      expect(vm.$el.firstChild.style.display).toBe('none')
      vm.foo = true
    }).then(() => {
      expect(vm.$el.firstChild.style.display).toBe('block')
    }).then(done)
  })

  it('should support unbind when reused', done => {
    const vm = new Vue({
      template:
        '<div v-if="tester"><span v-show="false"></span></div>' +
        '<div v-else><span @click="tester=!tester">show</span></div>',
      data: { tester: true }
    }).$mount()
    expect(vm.$el.firstChild.style.display).toBe('none')
    vm.tester = false
    waitForUpdate(() => {
      expect(vm.$el.firstChild.style.display).toBe('')
      vm.tester = true
    }).then(() => {
      expect(vm.$el.firstChild.style.display).toBe('none')
    }).then(done)
  })
})
