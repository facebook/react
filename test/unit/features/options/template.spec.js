import Vue from 'vue'

describe('Options template', () => {
  let el
  beforeEach(() => {
    el = document.createElement('script')
    el.type = 'x-template'
    el.id = 'app'
    el.innerHTML = '<p>{{message}}</p>'
    document.body.appendChild(el)
  })

  afterEach(() => {
    document.body.removeChild(el)
  })

  it('basic usage', () => {
    const vm = new Vue({
      template: '<div>{{message}}</div>',
      data: { message: 'hello world' }
    }).$mount()
    expect(vm.$el.tagName).toBe('DIV')
    expect(vm.$el.textContent).toBe(vm.message)
  })

  it('id reference', () => {
    const vm = new Vue({
      template: '#app',
      data: { message: 'hello world' }
    }).$mount()
    expect(vm.$el.tagName).toBe('P')
    expect(vm.$el.textContent).toBe(vm.message)
  })

  it('DOM element', () => {
    const elm = document.createElement('p')
    elm.innerHTML = '<p>{{message}}</p>'
    const vm = new Vue({
      template: elm,
      data: { message: 'hello world' }
    }).$mount()
    expect(vm.$el.tagName).toBe('P')
    expect(vm.$el.textContent).toBe(vm.message)
  })

  it('invalid template', () => {
    new Vue({
      template: Vue,
      data: { message: 'hello world' }
    }).$mount()
    expect('invalid template option').toHaveBeenWarned()
  })

  it('warn error in generated function', () => {
    new Vue({
      template: '<div v-if="!@"><span>{{ a"" }}</span><span>{{ do + 1 }}</span></div>'
    }).$mount()
    expect('Error compiling template').toHaveBeenWarned()
    expect('Raw expression: v-if="!@"').toHaveBeenWarned()
    expect('Raw expression: {{ a"" }}').toHaveBeenWarned()
    expect('avoid using JavaScript keyword as property name: "do"').toHaveBeenWarned()
  })

  it('should not warn $ prefixed keywords', () => {
    new Vue({
      template: `<div @click="$delete(foo, 'bar')"></div>`
    }).$mount()
    expect('avoid using JavaScript keyword as property name').not.toHaveBeenWarned()
  })

  it('warn error in generated function (v-for)', () => {
    new Vue({
      template: '<div><div v-for="(1, 2) in a----"></div></div>'
    }).$mount()
    expect('Error compiling template').toHaveBeenWarned()
    expect('invalid v-for alias "1"').toHaveBeenWarned()
    expect('invalid v-for iterator "2"').toHaveBeenWarned()
    expect('Raw expression: v-for="(1, 2) in a----"').toHaveBeenWarned()
  })

  it('warn error in generated function (v-on)', () => {
    new Vue({
      template: `<div @click="delete('Delete')"></div>`,
      methods: { delete: function () {} }
    }).$mount()
    expect('Error compiling template').toHaveBeenWarned()
    expect(
      `avoid using JavaScript unary operator as property name: "delete()" in expression @click="delete('Delete')"`
    ).toHaveBeenWarned()
  })
})
