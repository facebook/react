import Vue from 'vue'

describe('Directive v-pre', function () {
  it('should not compile inner content', function () {
    const vm = new Vue({
      template: `<div>
        <div v-pre>{{ a }}</div>
        <div>{{ a }}</div>
        <div v-pre>
          <component></component>
        </div>
      </div>`,
      data: {
        a: 123
      }
    })
    vm.$mount()
    expect(vm.$el.firstChild.textContent).toBe('{{ a }}')
    expect(vm.$el.children[1].textContent).toBe('123')
    expect(vm.$el.lastChild.innerHTML).toBe('<component></component>')
  })

  it('should not compile on root node', function () {
    const vm = new Vue({
      template: '<div v-pre>{{ a }}</div>',
      replace: true,
      data: {
        a: 123
      }
    })
    vm.$mount()
    expect(vm.$el.firstChild.textContent).toBe('{{ a }}')
  })
})
