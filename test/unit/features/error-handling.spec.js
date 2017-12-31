import Vue from 'vue'

const components = createErrorTestComponents()

describe('Error handling', () => {
  // hooks that prevents the component from rendering, but should not
  // break parent component
  ;[
    ['data', 'data()'],
    ['render', 'render'],
    ['beforeCreate', 'beforeCreate hook'],
    ['created', 'created hook'],
    ['beforeMount', 'beforeMount hook'],
    ['directive bind', 'directive foo bind hook'],
    ['event', 'event handler for "e"']
  ].forEach(([type, description]) => {
    it(`should recover from errors in ${type}`, done => {
      const vm = createTestInstance(components[type])
      expect(`Error in ${description}`).toHaveBeenWarned()
      expect(`Error: ${type}`).toHaveBeenWarned()
      assertRootInstanceActive(vm).then(done)
    })
  })

  // error in mounted hook should affect neither child nor parent
  it('should recover from errors in mounted hook', done => {
    const vm = createTestInstance(components.mounted)
    expect(`Error in mounted hook`).toHaveBeenWarned()
    expect(`Error: mounted`).toHaveBeenWarned()
    assertBothInstancesActive(vm).then(done)
  })

  // error in beforeUpdate/updated should affect neither child nor parent
  ;[
    ['beforeUpdate', 'beforeUpdate hook'],
    ['updated', 'updated hook'],
    ['directive update', 'directive foo update hook']
  ].forEach(([type, description]) => {
    it(`should recover from errors in ${type} hook`, done => {
      const vm = createTestInstance(components[type])
      assertBothInstancesActive(vm).then(() => {
        expect(`Error in ${description}`).toHaveBeenWarned()
        expect(`Error: ${type}`).toHaveBeenWarned()
      }).then(done)
    })
  })

  ;[
    ['beforeDestroy', 'beforeDestroy hook'],
    ['destroyed', 'destroyed hook'],
    ['directive unbind', 'directive foo unbind hook']
  ].forEach(([type, description]) => {
    it(`should recover from errors in ${type} hook`, done => {
      const vm = createTestInstance(components[type])
      vm.ok = false
      waitForUpdate(() => {
        expect(`Error in ${description}`).toHaveBeenWarned()
        expect(`Error: ${type}`).toHaveBeenWarned()
      }).thenWaitFor(next => {
        assertRootInstanceActive(vm).end(next)
      }).then(done)
    })
  })

  it('should recover from errors in user watcher getter', done => {
    const vm = createTestInstance(components.userWatcherGetter)
    vm.n++
    waitForUpdate(() => {
      expect(`Error in getter for watcher`).toHaveBeenWarned()
      function getErrorMsg () {
        try {
          this.a.b.c
        } catch (e) {
          return e.toString()
        }
      }
      const msg = getErrorMsg.call(vm)
      expect(msg).toHaveBeenWarned()
    }).thenWaitFor(next => {
      assertBothInstancesActive(vm).end(next)
    }).then(done)
  })

  it('should recover from errors in user watcher callback', done => {
    const vm = createTestInstance(components.userWatcherCallback)
    vm.n++
    waitForUpdate(() => {
      expect(`Error in callback for watcher "n"`).toHaveBeenWarned()
      expect(`Error: userWatcherCallback`).toHaveBeenWarned()
    }).thenWaitFor(next => {
      assertBothInstancesActive(vm).end(next)
    }).then(done)
  })

  it('config.errorHandler should capture render errors', done => {
    const spy = Vue.config.errorHandler = jasmine.createSpy('errorHandler')
    const vm = createTestInstance(components.render)

    const args = spy.calls.argsFor(0)
    expect(args[0].toString()).toContain('Error: render') // error
    expect(args[1]).toBe(vm.$refs.child) // vm
    expect(args[2]).toContain('render') // description

    assertRootInstanceActive(vm).then(() => {
      Vue.config.errorHandler = null
    }).then(done)
  })

  it('should capture and recover from nextTick errors', done => {
    const err1 = new Error('nextTick')
    const err2 = new Error('nextTick2')
    const spy = Vue.config.errorHandler = jasmine.createSpy('errorHandler')
    Vue.nextTick(() => { throw err1 })
    Vue.nextTick(() => {
      expect(spy).toHaveBeenCalledWith(err1, undefined, 'nextTick')

      const vm = new Vue()
      vm.$nextTick(() => { throw err2 })
      Vue.nextTick(() => {
        // should be called with correct instance info
        expect(spy).toHaveBeenCalledWith(err2, vm, 'nextTick')
        Vue.config.errorHandler = null
        done()
      })
    })
  })

  it('should recover from errors thrown in errorHandler itself', () => {
    Vue.config.errorHandler = () => {
      throw new Error('error in errorHandler ¯\\_(ツ)_/¯')
    }
    const vm = new Vue({
      render (h) {
        throw new Error('error in render')
      },
      renderError (h, err) {
        return h('div', err.toString())
      }
    }).$mount()
    expect('error in errorHandler').toHaveBeenWarned()
    expect('error in render').toHaveBeenWarned()
    expect(vm.$el.textContent).toContain('error in render')
    Vue.config.errorHandler = null
  })
})

function createErrorTestComponents () {
  const components = {}

  // data
  components.data = {
    data () {
      throw new Error('data')
    },
    render (h) {
      return h('div')
    }
  }

  // render error
  components.render = {
    render (h) {
      throw new Error('render')
    }
  }

  // lifecycle errors
  ;['create', 'mount', 'update', 'destroy'].forEach(hook => {
    // before
    const before = 'before' + hook.charAt(0).toUpperCase() + hook.slice(1)
    const beforeComp = components[before] = {
      props: ['n'],
      render (h) {
        return h('div', this.n)
      }
    }
    beforeComp[before] = function () {
      throw new Error(before)
    }

    // after
    const after = hook.replace(/e?$/, 'ed')
    const afterComp = components[after] = {
      props: ['n'],
      render (h) {
        return h('div', this.n)
      }
    }
    afterComp[after] = function () {
      throw new Error(after)
    }
  })

  // directive hooks errors
  ;['bind', 'update', 'unbind'].forEach(hook => {
    const key = 'directive ' + hook
    const dirComp = components[key] = {
      props: ['n'],
      template: `<div v-foo="n">{{ n }}</div>`
    }
    const dirFoo = {}
    dirFoo[hook] = function () {
      throw new Error(key)
    }
    dirComp.directives = {
      foo: dirFoo
    }
  })

  // user watcher
  components.userWatcherGetter = {
    props: ['n'],
    created () {
      this.$watch(function () {
        return this.n + this.a.b.c
      }, val => {
        console.log('user watcher fired: ' + val)
      })
    },
    render (h) {
      return h('div', this.n)
    }
  }

  components.userWatcherCallback = {
    props: ['n'],
    watch: {
      n () {
        throw new Error('userWatcherCallback error')
      }
    },
    render (h) {
      return h('div', this.n)
    }
  }

  // event errors
  components.event = {
    beforeCreate () {
      this.$on('e', () => { throw new Error('event') })
    },
    mounted () {
      this.$emit('e')
    },
    render (h) {
      return h('div')
    }
  }

  return components
}

function createTestInstance (Comp) {
  return new Vue({
    data: {
      n: 0,
      ok: true
    },
    render (h) {
      return h('div', [
        'n:' + this.n + '\n',
        this.ok
          ? h(Comp, { ref: 'child', props: { n: this.n }})
          : null
      ])
    }
  }).$mount()
}

function assertRootInstanceActive (vm, chain) {
  expect(vm.$el.innerHTML).toContain('n:0\n')
  vm.n++
  return waitForUpdate(() => {
    expect(vm.$el.innerHTML).toContain('n:1\n')
  })
}

function assertBothInstancesActive (vm) {
  vm.n = 0
  return waitForUpdate(() => {
    expect(vm.$refs.child.$el.innerHTML).toContain('0')
  }).thenWaitFor(next => {
    assertRootInstanceActive(vm).then(() => {
      expect(vm.$refs.child.$el.innerHTML).toContain('1')
    }).end(next)
  })
}
