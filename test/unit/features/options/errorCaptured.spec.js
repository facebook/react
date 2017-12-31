import Vue from 'vue'

describe('Options errorCaptured', () => {
  let globalSpy

  beforeEach(() => {
    globalSpy = Vue.config.errorHandler = jasmine.createSpy()
  })

  afterEach(() => {
    Vue.config.errorHandler = null
  })

  it('should capture error from child component', () => {
    const spy = jasmine.createSpy()

    let child
    let err
    const Child = {
      created () {
        child = this
        err = new Error('child')
        throw err
      },
      render () {}
    }

    new Vue({
      errorCaptured: spy,
      render: h => h(Child)
    }).$mount()

    expect(spy).toHaveBeenCalledWith(err, child, 'created hook')
    // should propagate by default
    expect(globalSpy).toHaveBeenCalledWith(err, child, 'created hook')
  })

  it('should be able to render the error in itself', done => {
    let child
    const Child = {
      created () {
        child = this
        throw new Error('error from child')
      },
      render () {}
    }

    const vm = new Vue({
      data: {
        error: null
      },
      errorCaptured (e, vm, info) {
        expect(vm).toBe(child)
        this.error = e.toString() + ' in ' + info
      },
      render (h) {
        if (this.error) {
          return h('pre', this.error)
        }
        return h(Child)
      }
    }).$mount()

    waitForUpdate(() => {
      expect(vm.$el.textContent).toContain('error from child')
      expect(vm.$el.textContent).toContain('in created hook')
    }).then(done)
  })

  it('should not propagate to global handler when returning true', () => {
    const spy = jasmine.createSpy()

    let child
    let err
    const Child = {
      created () {
        child = this
        err = new Error('child')
        throw err
      },
      render () {}
    }

    new Vue({
      errorCaptured (err, vm, info) {
        spy(err, vm, info)
        return false
      },
      render: h => h(Child, {})
    }).$mount()

    expect(spy).toHaveBeenCalledWith(err, child, 'created hook')
    // should not propagate
    expect(globalSpy).not.toHaveBeenCalled()
  })

  it('should propagate to global handler if itself throws error', () => {
    let child
    let err
    const Child = {
      created () {
        child = this
        err = new Error('child')
        throw err
      },
      render () {}
    }

    let err2
    const vm = new Vue({
      errorCaptured () {
        err2 = new Error('foo')
        throw err2
      },
      render: h => h(Child, {})
    }).$mount()

    expect(globalSpy).toHaveBeenCalledWith(err, child, 'created hook')
    expect(globalSpy).toHaveBeenCalledWith(err2, vm, 'errorCaptured hook')
  })

  it('should work across multiple parents, mixins and extends', () => {
    const calls = []

    const Child = {
      created () {
        throw new Error('child')
      },
      render () {}
    }

    const ErrorBoundaryBase = {
      errorCaptured () {
        calls.push(1)
      }
    }

    const mixin = {
      errorCaptured () {
        calls.push(2)
      }
    }

    const ErrorBoundaryExtended = {
      extends: ErrorBoundaryBase,
      mixins: [mixin],
      errorCaptured () {
        calls.push(3)
      },
      render: h => h(Child)
    }

    Vue.config.errorHandler = () => {
      calls.push(5)
    }

    new Vue({
      errorCaptured () {
        calls.push(4)
      },
      render: h => h(ErrorBoundaryExtended)
    }).$mount()

    expect(calls).toEqual([1, 2, 3, 4, 5])
  })

  it('should work across multiple parents, mixins and extends with return false', () => {
    const calls = []

    const Child = {
      created () {
        throw new Error('child')
      },
      render () {}
    }

    const ErrorBoundaryBase = {
      errorCaptured () {
        calls.push(1)
      }
    }

    const mixin = {
      errorCaptured () {
        calls.push(2)
      }
    }

    const ErrorBoundaryExtended = {
      extends: ErrorBoundaryBase,
      mixins: [mixin],
      errorCaptured () {
        calls.push(3)
        return false
      },
      render: h => h(Child)
    }

    Vue.config.errorHandler = () => {
      calls.push(5)
    }

    new Vue({
      errorCaptured () {
        calls.push(4)
      },
      render: h => h(ErrorBoundaryExtended)
    }).$mount()

    expect(calls).toEqual([1, 2, 3])
  })
})
