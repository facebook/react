import Vue from 'vue'
import injectStyles from '../transition/inject-styles'
import { isIE9 } from 'core/util/env'
import { nextFrame } from 'web/runtime/transition-util'

describe('Component keep-alive', () => {
  const { duration, buffer } = injectStyles()
  let components, one, two, el
  beforeEach(() => {
    one = {
      template: '<div>one</div>',
      created: jasmine.createSpy('one created'),
      mounted: jasmine.createSpy('one mounted'),
      activated: jasmine.createSpy('one activated'),
      deactivated: jasmine.createSpy('one deactivated'),
      destroyed: jasmine.createSpy('one destroyed')
    }
    two = {
      template: '<div>two</div>',
      created: jasmine.createSpy('two created'),
      mounted: jasmine.createSpy('two mounted'),
      activated: jasmine.createSpy('two activated'),
      deactivated: jasmine.createSpy('two deactivated'),
      destroyed: jasmine.createSpy('two destroyed')
    }
    components = {
      one,
      two
    }
    el = document.createElement('div')
    document.body.appendChild(el)
  })

  function assertHookCalls (component, callCounts) {
    expect([
      component.created.calls.count(),
      component.mounted.calls.count(),
      component.activated.calls.count(),
      component.deactivated.calls.count(),
      component.destroyed.calls.count()
    ]).toEqual(callCounts)
  }

  it('should work', done => {
    const vm = new Vue({
      template: `
        <div v-if="ok">
          <keep-alive>
            <component :is="view"></component>
          </keep-alive>
        </div>
      `,
      data: {
        view: 'one',
        ok: true
      },
      components
    }).$mount()
    expect(vm.$el.textContent).toBe('one')
    assertHookCalls(one, [1, 1, 1, 0, 0])
    assertHookCalls(two, [0, 0, 0, 0, 0])
    vm.view = 'two'
    waitForUpdate(() => {
      expect(vm.$el.textContent).toBe('two')
      assertHookCalls(one, [1, 1, 1, 1, 0])
      assertHookCalls(two, [1, 1, 1, 0, 0])
      vm.view = 'one'
    }).then(() => {
      expect(vm.$el.textContent).toBe('one')
      assertHookCalls(one, [1, 1, 2, 1, 0])
      assertHookCalls(two, [1, 1, 1, 1, 0])
      vm.view = 'two'
    }).then(() => {
      expect(vm.$el.textContent).toBe('two')
      assertHookCalls(one, [1, 1, 2, 2, 0])
      assertHookCalls(two, [1, 1, 2, 1, 0])
      vm.ok = false // teardown
    }).then(() => {
      expect(vm.$el.textContent).toBe('')
      assertHookCalls(one, [1, 1, 2, 2, 1])
      assertHookCalls(two, [1, 1, 2, 2, 1])
    }).then(done)
  })

  it('should invoke hooks on the entire sub tree', done => {
    one.template = '<two/>'
    one.components = { two }

    const vm = new Vue({
      template: `
        <div>
          <keep-alive>
            <one v-if="ok"/>
          </keep-alive>
        </div>
      `,
      data: {
        ok: true
      },
      components
    }).$mount()

    expect(vm.$el.textContent).toBe('two')
    assertHookCalls(one, [1, 1, 1, 0, 0])
    assertHookCalls(two, [1, 1, 1, 0, 0])
    vm.ok = false
    waitForUpdate(() => {
      expect(vm.$el.textContent).toBe('')
      assertHookCalls(one, [1, 1, 1, 1, 0])
      assertHookCalls(two, [1, 1, 1, 1, 0])
      vm.ok = true
    }).then(() => {
      expect(vm.$el.textContent).toBe('two')
      assertHookCalls(one, [1, 1, 2, 1, 0])
      assertHookCalls(two, [1, 1, 2, 1, 0])
      vm.ok = false
    }).then(() => {
      expect(vm.$el.textContent).toBe('')
      assertHookCalls(one, [1, 1, 2, 2, 0])
      assertHookCalls(two, [1, 1, 2, 2, 0])
    }).then(done)
  })

  it('should handle nested keep-alive hooks properly', done => {
    one.template = '<keep-alive><two v-if="ok" /></keep-alive>'
    one.data = () => ({ ok: true })
    one.components = { two }

    const vm = new Vue({
      template: `
        <div>
          <keep-alive>
            <one v-if="ok" ref="one" />
          </keep-alive>
        </div>
      `,
      data: {
        ok: true
      },
      components
    }).$mount()

    var oneInstance = vm.$refs.one
    expect(vm.$el.textContent).toBe('two')
    assertHookCalls(one, [1, 1, 1, 0, 0])
    assertHookCalls(two, [1, 1, 1, 0, 0])
    vm.ok = false
    waitForUpdate(() => {
      expect(vm.$el.textContent).toBe('')
      assertHookCalls(one, [1, 1, 1, 1, 0])
      assertHookCalls(two, [1, 1, 1, 1, 0])
    }).then(() => {
      vm.ok = true
    }).then(() => {
      expect(vm.$el.textContent).toBe('two')
      assertHookCalls(one, [1, 1, 2, 1, 0])
      assertHookCalls(two, [1, 1, 2, 1, 0])
    }).then(() => {
      // toggle sub component when activated
      oneInstance.ok = false
    }).then(() => {
      expect(vm.$el.textContent).toBe('')
      assertHookCalls(one, [1, 1, 2, 1, 0])
      assertHookCalls(two, [1, 1, 2, 2, 0])
    }).then(() => {
      oneInstance.ok = true
    }).then(() => {
      expect(vm.$el.textContent).toBe('two')
      assertHookCalls(one, [1, 1, 2, 1, 0])
      assertHookCalls(two, [1, 1, 3, 2, 0])
    }).then(() => {
      vm.ok = false
    }).then(() => {
      expect(vm.$el.textContent).toBe('')
      assertHookCalls(one, [1, 1, 2, 2, 0])
      assertHookCalls(two, [1, 1, 3, 3, 0])
    }).then(() => {
      // toggle sub component when parent is deactivated
      oneInstance.ok = false
    }).then(() => {
      expect(vm.$el.textContent).toBe('')
      assertHookCalls(one, [1, 1, 2, 2, 0])
      assertHookCalls(two, [1, 1, 3, 3, 0]) // should not be affected
    }).then(() => {
      oneInstance.ok = true
    }).then(() => {
      expect(vm.$el.textContent).toBe('')
      assertHookCalls(one, [1, 1, 2, 2, 0])
      assertHookCalls(two, [1, 1, 3, 3, 0]) // should not be affected
    }).then(() => {
      vm.ok = true
    }).then(() => {
      expect(vm.$el.textContent).toBe('two')
      assertHookCalls(one, [1, 1, 3, 2, 0])
      assertHookCalls(two, [1, 1, 4, 3, 0])
    }).then(() => {
      oneInstance.ok = false
      vm.ok = false
    }).then(() => {
      expect(vm.$el.textContent).toBe('')
      assertHookCalls(one, [1, 1, 3, 3, 0])
      assertHookCalls(two, [1, 1, 4, 4, 0])
    }).then(() => {
      vm.ok = true
    }).then(() => {
      expect(vm.$el.textContent).toBe('')
      assertHookCalls(one, [1, 1, 4, 3, 0])
      assertHookCalls(two, [1, 1, 4, 4, 0]) // should remain inactive
    }).then(done)
  })

  function sharedAssertions (vm, done) {
    expect(vm.$el.textContent).toBe('one')
    assertHookCalls(one, [1, 1, 1, 0, 0])
    assertHookCalls(two, [0, 0, 0, 0, 0])
    vm.view = 'two'
    waitForUpdate(() => {
      expect(vm.$el.textContent).toBe('two')
      assertHookCalls(one, [1, 1, 1, 1, 0])
      assertHookCalls(two, [1, 1, 0, 0, 0])
      vm.view = 'one'
    }).then(() => {
      expect(vm.$el.textContent).toBe('one')
      assertHookCalls(one, [1, 1, 2, 1, 0])
      assertHookCalls(two, [1, 1, 0, 0, 1])
      vm.view = 'two'
    }).then(() => {
      expect(vm.$el.textContent).toBe('two')
      assertHookCalls(one, [1, 1, 2, 2, 0])
      assertHookCalls(two, [2, 2, 0, 0, 1])
      vm.ok = false // teardown
    }).then(() => {
      expect(vm.$el.textContent).toBe('')
      assertHookCalls(one, [1, 1, 2, 2, 1])
      assertHookCalls(two, [2, 2, 0, 0, 2])
    }).then(done)
  }

  it('include (string)', done => {
    const vm = new Vue({
      template: `
        <div v-if="ok">
          <keep-alive include="one">
            <component :is="view"></component>
          </keep-alive>
        </div>
      `,
      data: {
        view: 'one',
        ok: true
      },
      components
    }).$mount()
    sharedAssertions(vm, done)
  })

  it('include (regex)', done => {
    const vm = new Vue({
      template: `
        <div v-if="ok">
          <keep-alive :include="/^one$/">
            <component :is="view"></component>
          </keep-alive>
        </div>
      `,
      data: {
        view: 'one',
        ok: true
      },
      components
    }).$mount()
    sharedAssertions(vm, done)
  })

  it('include (array)', done => {
    const vm = new Vue({
      template: `
        <div v-if="ok">
          <keep-alive :include="['one']">
            <component :is="view"></component>
          </keep-alive>
        </div>
      `,
      data: {
        view: 'one',
        ok: true
      },
      components
    }).$mount()
    sharedAssertions(vm, done)
  })

  it('exclude (string)', done => {
    const vm = new Vue({
      template: `
        <div v-if="ok">
          <keep-alive exclude="two">
            <component :is="view"></component>
          </keep-alive>
        </div>
      `,
      data: {
        view: 'one',
        ok: true
      },
      components
    }).$mount()
    sharedAssertions(vm, done)
  })

  it('exclude (regex)', done => {
    const vm = new Vue({
      template: `
        <div v-if="ok">
          <keep-alive :exclude="/^two$/">
            <component :is="view"></component>
          </keep-alive>
        </div>
      `,
      data: {
        view: 'one',
        ok: true
      },
      components
    }).$mount()
    sharedAssertions(vm, done)
  })

  it('exclude (array)', done => {
    const vm = new Vue({
      template: `
        <div v-if="ok">
          <keep-alive :exclude="['two']">
            <component :is="view"></component>
          </keep-alive>
        </div>
      `,
      data: {
        view: 'one',
        ok: true
      },
      components
    }).$mount()
    sharedAssertions(vm, done)
  })

  it('include + exclude', done => {
    const vm = new Vue({
      template: `
        <div v-if="ok">
          <keep-alive include="one,two" exclude="two">
            <component :is="view"></component>
          </keep-alive>
        </div>
      `,
      data: {
        view: 'one',
        ok: true
      },
      components
    }).$mount()
    sharedAssertions(vm, done)
  })

  it('prune cache on include/exclude change', done => {
    const vm = new Vue({
      template: `
        <div>
          <keep-alive :include="include">
            <component :is="view"></component>
          </keep-alive>
        </div>
      `,
      data: {
        view: 'one',
        include: 'one,two'
      },
      components
    }).$mount()

    vm.view = 'two'
    waitForUpdate(() => {
      assertHookCalls(one, [1, 1, 1, 1, 0])
      assertHookCalls(two, [1, 1, 1, 0, 0])
      vm.include = 'two'
    }).then(() => {
      assertHookCalls(one, [1, 1, 1, 1, 1])
      assertHookCalls(two, [1, 1, 1, 0, 0])
      vm.view = 'one'
    }).then(() => {
      assertHookCalls(one, [2, 2, 1, 1, 1])
      assertHookCalls(two, [1, 1, 1, 1, 0])
    }).then(done)
  })

  it('should not prune currently active instance', done => {
    const vm = new Vue({
      template: `
        <div>
          <keep-alive :include="include">
            <component :is="view"></component>
          </keep-alive>
        </div>
      `,
      data: {
        view: 'one',
        include: 'one,two'
      },
      components
    }).$mount()

    vm.include = 'two'
    waitForUpdate(() => {
      assertHookCalls(one, [1, 1, 1, 0, 0])
      assertHookCalls(two, [0, 0, 0, 0, 0])
      vm.view = 'two'
    }).then(() => {
      assertHookCalls(one, [1, 1, 1, 0, 1])
      assertHookCalls(two, [1, 1, 1, 0, 0])
    }).then(done)
  })

  // #3882
  it('deeply nested keep-alive should be destroyed properly', done => {
    one.template = `<div><keep-alive><two></two></keep-alive></div>`
    one.components = { two }
    const vm = new Vue({
      template: `<div><parent v-if="ok"></parent></div>`,
      data: { ok: true },
      components: {
        parent: {
          template: `<div><keep-alive><one></one></keep-alive></div>`,
          components: { one }
        }
      }
    }).$mount()

    assertHookCalls(one, [1, 1, 1, 0, 0])
    assertHookCalls(two, [1, 1, 1, 0, 0])

    vm.ok = false
    waitForUpdate(() => {
      assertHookCalls(one, [1, 1, 1, 1, 1])
      assertHookCalls(two, [1, 1, 1, 1, 1])
    }).then(done)
  })

  // #4237
  it('should update latest props/listeners for a re-activated component', done => {
    const one = {
      props: ['prop'],
      template: `<div>one {{ prop }}</div>`
    }
    const two = {
      props: ['prop'],
      template: `<div>two {{ prop }}</div>`
    }
    const vm = new Vue({
      data: { view: 'one', n: 1 },
      template: `
        <div>
          <keep-alive>
            <component :is="view" :prop="n"></component>
          </keep-alive>
        </div>
      `,
      components: { one, two }
    }).$mount()

    expect(vm.$el.textContent).toBe('one 1')
    vm.n++
    waitForUpdate(() => {
      expect(vm.$el.textContent).toBe('one 2')
      vm.view = 'two'
    }).then(() => {
      expect(vm.$el.textContent).toBe('two 2')
    }).then(done)
  })

  it('max', done => {
    const spyA = jasmine.createSpy()
    const spyB = jasmine.createSpy()
    const spyC = jasmine.createSpy()
    const spyAD = jasmine.createSpy()
    const spyBD = jasmine.createSpy()
    const spyCD = jasmine.createSpy()

    function assertCount (calls) {
      expect([
        spyA.calls.count(),
        spyAD.calls.count(),
        spyB.calls.count(),
        spyBD.calls.count(),
        spyC.calls.count(),
        spyCD.calls.count()
      ]).toEqual(calls)
    }

    const vm = new Vue({
      template: `
        <keep-alive max="2">
          <component :is="n"></component>
        </keep-alive>
      `,
      data: {
        n: 'aa'
      },
      components: {
        aa: {
          template: '<div>a</div>',
          created: spyA,
          destroyed: spyAD
        },
        bb: {
          template: '<div>bbb</div>',
          created: spyB,
          destroyed: spyBD
        },
        cc: {
          template: '<div>ccc</div>',
          created: spyC,
          destroyed: spyCD
        }
      }
    }).$mount()

    assertCount([1, 0, 0, 0, 0, 0])
    vm.n = 'bb'
    waitForUpdate(() => {
      assertCount([1, 0, 1, 0, 0, 0])
      vm.n = 'cc'
    }).then(() => {
      // should prune A because max cache reached
      assertCount([1, 1, 1, 0, 1, 0])
      vm.n = 'bb'
    }).then(() => {
      // B should be reused, and made latest
      assertCount([1, 1, 1, 0, 1, 0])
      vm.n = 'aa'
    }).then(() => {
      // C should be pruned because B was used last so C is the oldest cached
      assertCount([2, 1, 1, 0, 1, 1])
    }).then(done)
  })

  it('should warn unknown component inside', () => {
    new Vue({
      template: `<keep-alive><foo/></keep-alive>`
    }).$mount()
    expect(`Unknown custom element: <foo>`).toHaveBeenWarned()
  })

  // #6938
  it('should not cache anonymous component when include is specified', done => {
    const Foo = {
      name: 'foo',
      template: `<div>foo</div>`,
      created: jasmine.createSpy('foo')
    }

    const Bar = {
      template: `<div>bar</div>`,
      created: jasmine.createSpy('bar')
    }

    const Child = {
      functional: true,
      render (h, ctx) {
        return h(ctx.props.view ? Foo : Bar)
      }
    }

    const vm = new Vue({
      template: `
        <keep-alive include="foo">
          <child :view="view"></child>
        </keep-alive>
      `,
      data: {
        view: true
      },
      components: { Child }
    }).$mount()

    function assert (foo, bar) {
      expect(Foo.created.calls.count()).toBe(foo)
      expect(Bar.created.calls.count()).toBe(bar)
    }

    expect(vm.$el.textContent).toBe('foo')
    assert(1, 0)
    vm.view = false
    waitForUpdate(() => {
      expect(vm.$el.textContent).toBe('bar')
      assert(1, 1)
      vm.view = true
    }).then(() => {
      expect(vm.$el.textContent).toBe('foo')
      assert(1, 1)
      vm.view = false
    }).then(() => {
      expect(vm.$el.textContent).toBe('bar')
      assert(1, 2)
    }).then(done)
  })

  it('should cache anonymous components if include is not specified', done => {
    const Foo = {
      template: `<div>foo</div>`,
      created: jasmine.createSpy('foo')
    }

    const Bar = {
      template: `<div>bar</div>`,
      created: jasmine.createSpy('bar')
    }

    const Child = {
      functional: true,
      render (h, ctx) {
        return h(ctx.props.view ? Foo : Bar)
      }
    }

    const vm = new Vue({
      template: `
        <keep-alive>
          <child :view="view"></child>
        </keep-alive>
      `,
      data: {
        view: true
      },
      components: { Child }
    }).$mount()

    function assert (foo, bar) {
      expect(Foo.created.calls.count()).toBe(foo)
      expect(Bar.created.calls.count()).toBe(bar)
    }

    expect(vm.$el.textContent).toBe('foo')
    assert(1, 0)
    vm.view = false
    waitForUpdate(() => {
      expect(vm.$el.textContent).toBe('bar')
      assert(1, 1)
      vm.view = true
    }).then(() => {
      expect(vm.$el.textContent).toBe('foo')
      assert(1, 1)
      vm.view = false
    }).then(() => {
      expect(vm.$el.textContent).toBe('bar')
      assert(1, 1)
    }).then(done)
  })

  // #7105
  it('should not destroy active instance when pruning cache', done => {
    const Foo = {
      template: `<div>foo</div>`,
      destroyed: jasmine.createSpy('destroyed')
    }
    const vm = new Vue({
      template: `
        <div>
          <keep-alive :include="include">
            <foo/>
          </keep-alive>
        </div>
      `,
      data: {
        include: ['foo']
      },
      components: { Foo }
    }).$mount()
    // condition: a render where a previous component is reused
    vm.include = ['foo']
    waitForUpdate(() => {
      vm.include = ['']
    }).then(() => {
      expect(Foo.destroyed).not.toHaveBeenCalled()
    }).then(done)
  })

  if (!isIE9) {
    it('with transition-mode out-in', done => {
      let next
      const vm = new Vue({
        template: `<div>
          <transition name="test" mode="out-in" @after-leave="afterLeave">
            <keep-alive>
              <component :is="view" class="test"></component>
            </keep-alive>
          </transition>
        </div>`,
        data: {
          view: 'one'
        },
        components,
        methods: {
          afterLeave () {
            next()
          }
        }
      }).$mount(el)
      expect(vm.$el.textContent).toBe('one')
      assertHookCalls(one, [1, 1, 1, 0, 0])
      assertHookCalls(two, [0, 0, 0, 0, 0])
      vm.view = 'two'
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave test-leave-active">one</div><!---->'
        )
        assertHookCalls(one, [1, 1, 1, 1, 0])
        assertHookCalls(two, [0, 0, 0, 0, 0])
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave-active test-leave-to">one</div><!---->'
        )
      }).thenWaitFor(_next => { next = _next }).then(() => {
        expect(vm.$el.innerHTML).toBe('<!---->')
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-enter test-enter-active">two</div>'
        )
        assertHookCalls(one, [1, 1, 1, 1, 0])
        assertHookCalls(two, [1, 1, 1, 0, 0])
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-enter-active test-enter-to">two</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>'
        )
        assertHookCalls(one, [1, 1, 1, 1, 0])
        assertHookCalls(two, [1, 1, 1, 0, 0])
      }).then(() => {
        vm.view = 'one'
      }).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave test-leave-active">two</div><!---->'
        )
        assertHookCalls(one, [1, 1, 1, 1, 0])
        assertHookCalls(two, [1, 1, 1, 1, 0])
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave-active test-leave-to">two</div><!---->'
        )
      }).thenWaitFor(_next => { next = _next }).then(() => {
        expect(vm.$el.innerHTML).toBe('<!---->')
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-enter test-enter-active">one</div>'
        )
        assertHookCalls(one, [1, 1, 2, 1, 0])
        assertHookCalls(two, [1, 1, 1, 1, 0])
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-enter-active test-enter-to">one</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">one</div>'
        )
        assertHookCalls(one, [1, 1, 2, 1, 0])
        assertHookCalls(two, [1, 1, 1, 1, 0])
      }).then(done)
    })

    it('with transition-mode out-in + include', done => {
      let next
      const vm = new Vue({
        template: `<div>
          <transition name="test" mode="out-in" @after-leave="afterLeave">
            <keep-alive include="one">
              <component :is="view" class="test"></component>
            </keep-alive>
          </transition>
        </div>`,
        data: {
          view: 'one'
        },
        components,
        methods: {
          afterLeave () {
            next()
          }
        }
      }).$mount(el)
      expect(vm.$el.textContent).toBe('one')
      assertHookCalls(one, [1, 1, 1, 0, 0])
      assertHookCalls(two, [0, 0, 0, 0, 0])
      vm.view = 'two'
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave test-leave-active">one</div><!---->'
        )
        assertHookCalls(one, [1, 1, 1, 1, 0])
        assertHookCalls(two, [0, 0, 0, 0, 0])
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave-active test-leave-to">one</div><!---->'
        )
      }).thenWaitFor(_next => { next = _next }).then(() => {
        expect(vm.$el.innerHTML).toBe('<!---->')
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-enter test-enter-active">two</div>'
        )
        assertHookCalls(one, [1, 1, 1, 1, 0])
        assertHookCalls(two, [1, 1, 0, 0, 0])
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-enter-active test-enter-to">two</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>'
        )
        assertHookCalls(one, [1, 1, 1, 1, 0])
        assertHookCalls(two, [1, 1, 0, 0, 0])
      }).then(() => {
        vm.view = 'one'
      }).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave test-leave-active">two</div><!---->'
        )
        assertHookCalls(one, [1, 1, 1, 1, 0])
        assertHookCalls(two, [1, 1, 0, 0, 1])
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave-active test-leave-to">two</div><!---->'
        )
      }).thenWaitFor(_next => { next = _next }).then(() => {
        expect(vm.$el.innerHTML).toBe('<!---->')
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-enter test-enter-active">one</div>'
        )
        assertHookCalls(one, [1, 1, 2, 1, 0])
        assertHookCalls(two, [1, 1, 0, 0, 1])
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-enter-active test-enter-to">one</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">one</div>'
        )
        assertHookCalls(one, [1, 1, 2, 1, 0])
        assertHookCalls(two, [1, 1, 0, 0, 1])
      }).then(done)
    })

    it('with transition-mode in-out', done => {
      let next
      const vm = new Vue({
        template: `<div>
          <transition name="test" mode="in-out" @after-enter="afterEnter">
            <keep-alive>
              <component :is="view" class="test"></component>
            </keep-alive>
          </transition>
        </div>`,
        data: {
          view: 'one'
        },
        components,
        methods: {
          afterEnter () {
            next()
          }
        }
      }).$mount(el)
      expect(vm.$el.textContent).toBe('one')
      assertHookCalls(one, [1, 1, 1, 0, 0])
      assertHookCalls(two, [0, 0, 0, 0, 0])
      vm.view = 'two'
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">one</div>' +
          '<div class="test test-enter test-enter-active">two</div>'
        )
        assertHookCalls(one, [1, 1, 1, 1, 0])
        assertHookCalls(two, [1, 1, 1, 0, 0])
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">one</div>' +
          '<div class="test test-enter-active test-enter-to">two</div>'
        )
      }).thenWaitFor(_next => { next = _next }).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">one</div>' +
          '<div class="test">two</div>'
        )
      }).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave test-leave-active">one</div>' +
          '<div class="test">two</div>'
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave-active test-leave-to">one</div>' +
          '<div class="test">two</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>'
        )
        assertHookCalls(one, [1, 1, 1, 1, 0])
        assertHookCalls(two, [1, 1, 1, 0, 0])
      }).then(() => {
        vm.view = 'one'
      }).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>' +
          '<div class="test test-enter test-enter-active">one</div>'
        )
        assertHookCalls(one, [1, 1, 2, 1, 0])
        assertHookCalls(two, [1, 1, 1, 1, 0])
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>' +
          '<div class="test test-enter-active test-enter-to">one</div>'
        )
      }).thenWaitFor(_next => { next = _next }).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>' +
          '<div class="test">one</div>'
        )
      }).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave test-leave-active">two</div>' +
          '<div class="test">one</div>'
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave-active test-leave-to">two</div>' +
          '<div class="test">one</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">one</div>'
        )
        assertHookCalls(one, [1, 1, 2, 1, 0])
        assertHookCalls(two, [1, 1, 1, 1, 0])
      }).then(done)
    })

    it('dynamic components, in-out with early cancel', done => {
      let next
      const vm = new Vue({
        template: `<div>
          <transition name="test" mode="in-out" @after-enter="afterEnter">
            <keep-alive>
              <component :is="view" class="test"></component>
            </keep-alive>
          </transition>
        </div>`,
        data: { view: 'one' },
        components,
        methods: {
          afterEnter () {
            next()
          }
        }
      }).$mount(el)
      expect(vm.$el.textContent).toBe('one')
      vm.view = 'two'
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">one</div>' +
          '<div class="test test-enter test-enter-active">two</div>'
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">one</div>' +
          '<div class="test test-enter-active test-enter-to">two</div>'
        )
        // switch again before enter finishes,
        // this cancels both enter and leave.
        vm.view = 'one'
      }).then(() => {
        // 1. the pending leaving "one" should be removed instantly.
        // 2. the entering "two" should be placed into its final state instantly.
        // 3. a new "one" is created and entering
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>' +
          '<div class="test test-enter test-enter-active">one</div>'
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>' +
          '<div class="test test-enter-active test-enter-to">one</div>'
        )
      }).thenWaitFor(_next => { next = _next }).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>' +
          '<div class="test">one</div>'
        )
      }).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave test-leave-active">two</div>' +
          '<div class="test">one</div>'
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave-active test-leave-to">two</div>' +
          '<div class="test">one</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">one</div>'
        )
      }).then(done).then(done)
    })

    // #4339
    it('component with inner transition', done => {
      const vm = new Vue({
        template: `
          <div>
            <keep-alive>
              <component ref="test" :is="view"></component>
            </keep-alive>
          </div>
        `,
        data: { view: 'foo' },
        components: {
          foo: { template: '<transition><div class="test">foo</div></transition>' },
          bar: { template: '<transition name="test"><div class="test">bar</div></transition>' }
        }
      }).$mount(el)

      // should not apply transition on initial render by default
      expect(vm.$el.innerHTML).toBe('<div class="test">foo</div>')
      vm.view = 'bar'
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test v-leave v-leave-active">foo</div>' +
          '<div class="test test-enter test-enter-active">bar</div>'
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test v-leave-active v-leave-to">foo</div>' +
          '<div class="test test-enter-active test-enter-to">bar</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">bar</div>'
        )
        vm.view = 'foo'
      }).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave test-leave-active">bar</div>' +
          '<div class="test v-enter v-enter-active">foo</div>'
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave-active test-leave-to">bar</div>' +
          '<div class="test v-enter-active v-enter-to">foo</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">foo</div>'
        )
      }).then(done)
    })

    it('async components with transition-mode out-in', done => {
      const barResolve = jasmine.createSpy('bar resolved')
      let next
      const foo = (resolve) => {
        setTimeout(() => {
          resolve(one)
          Vue.nextTick(next)
        }, duration / 2)
      }
      const bar = (resolve) => {
        setTimeout(() => {
          resolve(two)
          barResolve()
        }, duration / 2)
      }
      components = {
        foo,
        bar
      }
      const vm = new Vue({
        template: `<div>
          <transition name="test" mode="out-in" @after-enter="afterEnter" @after-leave="afterLeave">
            <keep-alive>
              <component :is="view" class="test"></component>
            </keep-alive>
          </transition>
        </div>`,
        data: {
          view: 'foo'
        },
        components,
        methods: {
          afterEnter () {
            next()
          },
          afterLeave () {
            next()
          }
        }
      }).$mount(el)
      expect(vm.$el.textContent).toBe('')
      next = () => {
        assertHookCalls(one, [1, 1, 1, 0, 0])
        assertHookCalls(two, [0, 0, 0, 0, 0])
        waitForUpdate(() => {
          expect(vm.$el.innerHTML).toBe(
            '<div class="test test-enter test-enter-active">one</div>'
          )
        }).thenWaitFor(nextFrame).then(() => {
          expect(vm.$el.innerHTML).toBe(
            '<div class="test test-enter-active test-enter-to">one</div>'
          )
        }).thenWaitFor(_next => { next = _next }).then(() => {
          // foo afterEnter get called
          expect(vm.$el.innerHTML).toBe('<div class="test">one</div>')
          vm.view = 'bar'
        }).thenWaitFor(nextFrame).then(() => {
          assertHookCalls(one, [1, 1, 1, 1, 0])
          assertHookCalls(two, [0, 0, 0, 0, 0])
          expect(vm.$el.innerHTML).toBe(
            '<div class="test test-leave-active test-leave-to">one</div><!---->'
          )
        }).thenWaitFor(_next => { next = _next }).then(() => {
          // foo afterLeave get called
          // and bar has already been resolved before afterLeave get called
          expect(barResolve.calls.count()).toBe(1)
          expect(vm.$el.innerHTML).toBe('<!---->')
        }).thenWaitFor(nextFrame).then(() => {
          expect(vm.$el.innerHTML).toBe(
            '<div class="test test-enter test-enter-active">two</div>'
          )
          assertHookCalls(one, [1, 1, 1, 1, 0])
          assertHookCalls(two, [1, 1, 1, 0, 0])
        }).thenWaitFor(nextFrame).then(() => {
          expect(vm.$el.innerHTML).toBe(
            '<div class="test test-enter-active test-enter-to">two</div>'
          )
        }).thenWaitFor(_next => { next = _next }).then(() => {
          // bar afterEnter get called
          expect(vm.$el.innerHTML).toBe('<div class="test">two</div>')
        }).then(done)
      }
    })
  }
})
