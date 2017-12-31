import Vue from 'vue'
import {
  MAX_UPDATE_COUNT,
  queueWatcher as _queueWatcher
} from 'core/observer/scheduler'

function queueWatcher (watcher) {
  watcher.vm = {} // mock vm
  _queueWatcher(watcher)
}

describe('Scheduler', () => {
  let spy
  beforeEach(() => {
    spy = jasmine.createSpy('scheduler')
  })

  it('queueWatcher', done => {
    queueWatcher({
      run: spy
    })
    waitForUpdate(() => {
      expect(spy.calls.count()).toBe(1)
    }).then(done)
  })

  it('dedup', done => {
    queueWatcher({
      id: 1,
      run: spy
    })
    queueWatcher({
      id: 1,
      run: spy
    })
    waitForUpdate(() => {
      expect(spy.calls.count()).toBe(1)
    }).then(done)
  })

  it('allow duplicate when flushing', done => {
    const job = {
      id: 1,
      run: spy
    }
    queueWatcher(job)
    queueWatcher({
      id: 2,
      run () { queueWatcher(job) }
    })
    waitForUpdate(() => {
      expect(spy.calls.count()).toBe(2)
    }).then(done)
  })

  it('call user watchers before component re-render', done => {
    const calls = []
    const vm = new Vue({
      data: {
        a: 1
      },
      template: '<div>{{ a }}</div>',
      watch: {
        a () { calls.push(1) }
      },
      beforeUpdate () {
        calls.push(2)
      }
    }).$mount()
    vm.a = 2
    waitForUpdate(() => {
      expect(calls).toEqual([1, 2])
    }).then(done)
  })

  it('call user watcher triggered by component re-render immediately', done => {
    // this happens when a component re-render updates the props of a child
    const calls = []
    const vm = new Vue({
      data: {
        a: 1
      },
      watch: {
        a () {
          calls.push(1)
        }
      },
      beforeUpdate () {
        calls.push(2)
      },
      template: '<div><test :a="a"></test></div>',
      components: {
        test: {
          props: ['a'],
          template: '<div>{{ a }}</div>',
          watch: {
            a () {
              calls.push(3)
            }
          },
          beforeUpdate () {
            calls.push(4)
          }
        }
      }
    }).$mount()
    vm.a = 2
    waitForUpdate(() => {
      expect(calls).toEqual([1, 2, 3, 4])
    }).then(done)
  })

  it('warn against infinite update loops', function (done) {
    let count = 0
    const job = {
      id: 1,
      run () {
        count++
        queueWatcher(job)
      }
    }
    queueWatcher(job)
    waitForUpdate(() => {
      expect(count).toBe(MAX_UPDATE_COUNT + 1)
      expect('infinite update loop').toHaveBeenWarned()
    }).then(done)
  })

  it('should call newly pushed watcher after current watcher is done', done => {
    const callOrder = []
    queueWatcher({
      id: 1,
      user: true,
      run () {
        callOrder.push(1)
        queueWatcher({
          id: 2,
          run () {
            callOrder.push(3)
          }
        })
        callOrder.push(2)
      }
    })
    waitForUpdate(() => {
      expect(callOrder).toEqual([1, 2, 3])
    }).then(done)
  })

  // GitHub issue #5191
  it('emit should work when updated hook called', done => {
    const el = document.createElement('div')
    const vm = new Vue({
      template: `<div><child @change="bar" :foo="foo"></child></div>`,
      data: {
        foo: 0
      },
      methods: {
        bar: spy
      },
      components: {
        child: {
          template: `<div>{{foo}}</div>`,
          props: ['foo'],
          updated () {
            this.$emit('change')
          }
        }
      }
    }).$mount(el)
    vm.$nextTick(() => {
      vm.foo = 1
      vm.$nextTick(() => {
        expect(vm.$el.innerHTML).toBe('<div>1</div>')
        expect(spy).toHaveBeenCalled()
        done()
      })
    })
  })
})
