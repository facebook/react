import Vue from 'vue'

describe('Options name', () => {
  it('should contain itself in self components', () => {
    const vm = Vue.extend({
      name: 'SuperVue'
    })

    expect(vm.options.components['SuperVue']).toEqual(vm)
  })

  it('should warn when incorrect name given', () => {
    Vue.extend({
      name: 'Hyper*Vue'
    })

    /* eslint-disable */
    expect(`Invalid component name: "Hyper*Vue". Component names can only contain alphanumeric characters and the hyphen, and must start with a letter.`)
      .toHaveBeenWarned()
    /* eslint-enable */

    Vue.extend({
      name: '2Cool2BValid'
    })

    /* eslint-disable */
    expect(`Invalid component name: "2Cool2BValid". Component names can only contain alphanumeric characters and the hyphen, and must start with a letter.`)
      .toHaveBeenWarned()
    /* eslint-enable */
  })

  it('id should not override given name when using Vue.component', () => {
    const SuperComponent = Vue.component('super-component', {
      name: 'SuperVue'
    })

    expect(SuperComponent.options.components['SuperVue']).toEqual(SuperComponent)
    expect(SuperComponent.options.components['super-component']).toEqual(SuperComponent)
  })
})
