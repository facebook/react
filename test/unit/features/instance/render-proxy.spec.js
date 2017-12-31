import Vue from 'vue'

if (typeof Proxy !== 'undefined') {
  describe('render proxy', () => {
    it('should warn missing property in render fns with `with`', () => {
      new Vue({
        template: `<div>{{ a }}</div>`
      }).$mount()
      expect(`Property or method "a" is not defined`).toHaveBeenWarned()
    })

    it('should warn missing property in render fns without `with`', () => {
      const render = function (h) {
        return h('div', [this.a])
      }
      render._withStripped = true
      new Vue({
        render
      }).$mount()
      expect(`Property or method "a" is not defined`).toHaveBeenWarned()
    })

    it('should not warn for hand-written render functions', () => {
      new Vue({
        render (h) {
          return h('div', [this.a])
        }
      }).$mount()
      expect(`Property or method "a" is not defined`).not.toHaveBeenWarned()
    })
  })
}
