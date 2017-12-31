import Vue from 'vue'

describe('Directive v-cloak', () => {
  it('should be removed after compile', () => {
    const el = document.createElement('div')
    el.setAttribute('v-cloak', '')
    const vm = new Vue({ el })
    expect(vm.$el.hasAttribute('v-cloak')).toBe(false)
  })
})
