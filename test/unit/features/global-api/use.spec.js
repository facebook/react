import Vue from 'vue'

describe('Global API: use', () => {
  const def = {}
  const options = {}
  const pluginStub = {
    install: (Vue, opts) => {
      Vue.directive('plugin-test', def)
      expect(opts).toBe(options)
    }
  }

  it('should apply Object plugin', () => {
    Vue.use(pluginStub, options)
    expect(Vue.options.directives['plugin-test']).toBe(def)
    delete Vue.options.directives['plugin-test']
    expect(Vue.options.directives['plugin-test']).toBeUndefined()

    // should not double apply
    Vue.use(pluginStub, options)
    expect(Vue.options.directives['plugin-test']).toBeUndefined()
  })

  it('should apply Function plugin', () => {
    Vue.use(pluginStub.install, options)
    expect(Vue.options.directives['plugin-test']).toBe(def)
    delete Vue.options.directives['plugin-test']
  })

  it('should work on extended constructors without polluting the base', () => {
    const Ctor = Vue.extend({})
    Ctor.use(pluginStub, options)
    expect(Vue.options.directives['plugin-test']).toBeUndefined()
    expect(Ctor.options.directives['plugin-test']).toBe(def)
  })

  // GitHub issue #5970
  it('should work on multi version', () => {
    const Ctor1 = Vue.extend({})
    const Ctor2 = Vue.extend({})

    Ctor1.use(pluginStub, options)
    expect(Vue.options.directives['plugin-test']).toBeUndefined()
    expect(Ctor1.options.directives['plugin-test']).toBe(def)

    // multi version Vue Ctor with the same cid
    Ctor2.cid = Ctor1.cid
    Ctor2.use(pluginStub, options)
    expect(Vue.options.directives['plugin-test']).toBeUndefined()
    expect(Ctor2.options.directives['plugin-test']).toBe(def)
  })
})
