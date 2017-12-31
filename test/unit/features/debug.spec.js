import Vue from 'vue'
import { formatComponentName, warn } from 'core/util/debug'

describe('Debug utilities', () => {
  it('properly format component names', () => {
    const vm = new Vue()
    expect(formatComponentName(vm)).toBe('<Root>')

    vm.$root = null
    vm.$options.name = 'hello-there'
    expect(formatComponentName(vm)).toBe('<HelloThere>')

    vm.$options.name = null
    vm.$options._componentTag = 'foo-bar-1'
    expect(formatComponentName(vm)).toBe('<FooBar1>')

    vm.$options._componentTag = null
    vm.$options.__file = '/foo/bar/baz/SomeThing.vue'
    expect(formatComponentName(vm)).toBe(`<SomeThing> at ${vm.$options.__file}`)
    expect(formatComponentName(vm, false)).toBe('<SomeThing>')

    vm.$options.__file = 'C:\\foo\\bar\\baz\\windows_file.vue'
    expect(formatComponentName(vm)).toBe(`<WindowsFile> at ${vm.$options.__file}`)
    expect(formatComponentName(vm, false)).toBe('<WindowsFile>')
  })

  it('generate correct component hierarchy trace', () => {
    const one = {
      name: 'one',
      render: h => h(two)
    }
    const two = {
      name: 'two',
      render: h => h(three)
    }
    const three = {
      name: 'three'
    }
    new Vue({
      render: h => h(one)
    }).$mount()

    expect(
      `Failed to mount component: template or render function not defined.

found in

---> <Three>
       <Two>
         <One>
           <Root>`
    ).toHaveBeenWarned()
  })

  it('generate correct component hierarchy trace (recursive)', () => {
    let i = 0
    const one = {
      name: 'one',
      render: h => i++ < 5 ? h(one) : h(two)
    }
    const two = {
      name: 'two',
      render: h => h(three)
    }
    const three = {
      name: 'three'
    }
    new Vue({
      render: h => h(one)
    }).$mount()

    expect(
      `Failed to mount component: template or render function not defined.

found in

---> <Three>
       <Two>
         <One>... (5 recursive calls)
           <Root>`
    ).toHaveBeenWarned()
  })

  describe('warn', () => {
    const msg = 'message'
    const vm = new Vue()

    it('calls warnHandler if warnHandler is set', () => {
      Vue.config.warnHandler = jasmine.createSpy()

      warn(msg, vm)

      expect(Vue.config.warnHandler).toHaveBeenCalledWith(msg, vm, jasmine.any(String))

      Vue.config.warnHandler = null
    })

    it('calls console.error if silent is false', () => {
      Vue.config.silent = false

      warn(msg, vm)

      expect(msg).toHaveBeenWarned()
      expect(console.error).toHaveBeenCalled()
    })

    it('does not call console.error if silent is true', () => {
      Vue.config.silent = true

      warn(msg, vm)

      expect(console.error).not.toHaveBeenCalled()

      Vue.config.silent = false
    })
  })
})
