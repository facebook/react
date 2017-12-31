import Vue from 'vue'

describe('Delimiters', () => {
  it('default delimiters should work', () => {
    const vm = new Vue({
      data: {
        a: 1
      },
      template: '<div>{{ a }}</div>'
    }).$mount()
    expect(vm.$el.textContent).toEqual('1')
  })

  it('custom delimiters should work', () => {
    const vm = new Vue({
      delimiters: ['[[', ']]'],
      template: '<div>[[ a ]]</div>',
      data: {
        a: 1
      }
    }).$mount()

    expect(vm.$el.textContent).toEqual('1')
  })

  it('default delimiters should be ignored when custom delimiters defined', () => {
    const vm = new Vue({
      delimiters: ['[[', ']]'],
      template: '<div>{{ a }}</div>',
      data: {
        a: 1
      }
    }).$mount()

    expect(vm.$el.textContent).toEqual('{{ a }}')
  })

  it('delimiters should only affect vm', () => {
    const Component = Vue.extend({
      data: function () {
        return {
          b: 2
        }
      },
      template: '<span>[[ b ]]</span>'
    })

    const vm = new Vue({
      delimiters: ['[[', ']]'],
      template: '<div>[[ a ]] - <test-component></test-component></div>',
      data: {
        a: 2
      },
      components: {
        'test-component': Component
      }
    }).$mount()

    expect(vm.$el.textContent).toEqual('2 - [[ b ]]')
  })

  it('delimiters defined globally should work on all vms', () => {
    Vue.options.delimiters = ['[[', ']]']

    const Component = Vue.extend({
      template: '<span>[[ a ]]</span>',
      data: function () {
        return {
          a: 2
        }
      }
    })

    const vm = new Vue({
      data: {
        b: 1
      },
      template: '<div>[[ b ]] - <test-component></test-component></div>',
      components: {
        'test-component': Component
      }
    }).$mount()

    expect(vm.$el.textContent).toEqual('1 - 2')
    // restore default options
    delete Vue.options.delimiters
  })

  it('component specific delimiters should override global delimiters', () => {
    Vue.options.delimiters = ['[[', ']]']

    const Component = Vue.extend({
      delimiters: ['@{{', '}}'],
      template: '<span>@{{ a }}</span>',
      data: function () {
        return {
          a: 2
        }
      }
    })

    const vm = new Vue({
      data: {
        b: 1
      },
      template: '<div>[[ b ]] - <test-component></test-component></div>',
      components: {
        'test-component': Component
      }
    }).$mount()

    expect(vm.$el.textContent).toEqual('1 - 2')
    // restore default options
    delete Vue.options.delimiters
  })
})
