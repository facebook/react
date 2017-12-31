import Vue from 'vue'
import injectStyles from './inject-styles'
import { isIE9 } from 'core/util/env'
import { nextFrame } from 'web/runtime/transition-util'

if (!isIE9) {
  describe('Transition mode', () => {
    const { duration, buffer } = injectStyles()
    const components = {
      one: { template: '<div>one</div>' },
      two: { template: '<div>two</div>' }
    }

    let el
    beforeEach(() => {
      el = document.createElement('div')
      document.body.appendChild(el)
    })

    it('dynamic components, simultaneous', done => {
      const vm = new Vue({
        template: `<div>
          <transition>
            <component :is="view" class="test">
            </component>
          </transition>
        </div>`,
        data: { view: 'one' },
        components
      }).$mount(el)
      expect(vm.$el.textContent).toBe('one')
      vm.view = 'two'
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test v-leave v-leave-active">one</div>' +
          '<div class="test v-enter v-enter-active">two</div>'
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test v-leave-active v-leave-to">one</div>' +
          '<div class="test v-enter-active v-enter-to">two</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>'
        )
      }).then(done)
    })

    it('dynamic components, out-in', done => {
      let next
      const vm = new Vue({
        template: `<div>
          <transition name="test" mode="out-in" @after-leave="afterLeave">
            <component :is="view" class="test">
            </component>
          </transition>
        </div>`,
        data: { view: 'one' },
        components,
        methods: {
          afterLeave () {
            next()
          }
        }
      }).$mount(el)
      expect(vm.$el.textContent).toBe('one')
      vm.view = 'two'
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave test-leave-active">one</div><!---->'
        )
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
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-enter-active test-enter-to">two</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>'
        )
      }).then(done)
    })

    // #3440
    it('dynamic components, out-in (with extra re-render)', done => {
      let next
      const vm = new Vue({
        template: `<div>
          <transition name="test" mode="out-in" @after-leave="afterLeave">
            <component :is="view" class="test">
            </component>
          </transition>
        </div>`,
        data: { view: 'one' },
        components,
        methods: {
          afterLeave () {
            next()
          }
        }
      }).$mount(el)
      expect(vm.$el.textContent).toBe('one')
      vm.view = 'two'
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave test-leave-active">one</div><!---->'
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave-active test-leave-to">one</div><!---->'
        )
        // Force re-render before the element finishes leaving
        // this should not cause the incoming element to enter early
        vm.$forceUpdate()
      }).thenWaitFor(_next => { next = _next }).then(() => {
        expect(vm.$el.innerHTML).toBe('<!---->')
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-enter test-enter-active">two</div>'
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-enter-active test-enter-to">two</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>'
        )
      }).then(done)
    })

    it('dynamic components, in-out', done => {
      let next
      const vm = new Vue({
        template: `<div>
          <transition name="test" mode="in-out" @after-enter="afterEnter">
            <component :is="view" class="test">
            </component>
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
      }).then(done)
    })

    it('dynamic components, in-out with early cancel', done => {
      let next
      const vm = new Vue({
        template: `<div>
          <transition name="test" mode="in-out" @after-enter="afterEnter">
            <component :is="view" class="test"></component>
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

    it('normal elements with different keys, simultaneous', done => {
      const vm = new Vue({
        template: `<div>
          <transition>
            <div :key="view" class="test">{{view}}</div>
          </transition>
        </div>`,
        data: { view: 'one' },
        components
      }).$mount(el)
      expect(vm.$el.textContent).toBe('one')
      vm.view = 'two'
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test v-leave v-leave-active">one</div>' +
          '<div class="test v-enter v-enter-active">two</div>'
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test v-leave-active v-leave-to">one</div>' +
          '<div class="test v-enter-active v-enter-to">two</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>'
        )
      }).then(done)
    })

    it('normal elements with different keys, out-in', done => {
      let next
      const vm = new Vue({
        template: `<div>
          <transition name="test" mode="out-in" @after-leave="afterLeave">
            <div :key="view" class="test">{{view}}</div>
          </transition>
        </div>`,
        data: { view: 'one' },
        components,
        methods: {
          afterLeave () {
            next()
          }
        }
      }).$mount(el)
      expect(vm.$el.textContent).toBe('one')
      vm.view = 'two'
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-leave test-leave-active">one</div><!---->'
        )
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
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test test-enter-active test-enter-to">two</div>'
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          '<div class="test">two</div>'
        )
      }).then(done)
    })

    it('normal elements with different keys, in-out', done => {
      let next
      const vm = new Vue({
        template: `<div>
          <transition name="test" mode="in-out" @after-enter="afterEnter">
            <div :key="view" class="test">{{view}}</div>
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
      }).then(done)
    })

    it('transition out-in on async component (resolve before leave complete)', done => {
      const vm = new Vue({
        template: `
          <div>
            <transition name="test-anim" mode="out-in">
              <component-a v-if="ok"></component-a>
              <component-b v-else></component-b>
            </transition>
          </div>
        `,
        components: {
          componentA: resolve => {
            setTimeout(() => {
              resolve({ template: '<div><h1>component A</h1></div>' })
              next1()
            }, duration / 2)
          },
          componentB: resolve => {
            setTimeout(() => {
              resolve({ template: '<div><h1>component B</h1></div>' })
            }, duration / 2)
          }
        },
        data: {
          ok: true
        }
      }).$mount(el)

      expect(vm.$el.innerHTML).toBe('<!---->')

      function next1 () {
        Vue.nextTick(() => {
          expect(vm.$el.children.length).toBe(1)
          expect(vm.$el.textContent).toBe('component A')
          expect(vm.$el.children[0].className).toBe('test-anim-enter test-anim-enter-active')
          nextFrame(() => {
            expect(vm.$el.children[0].className).toBe('test-anim-enter-active test-anim-enter-to')
            setTimeout(() => {
              expect(vm.$el.children[0].className).toBe('')
              vm.ok = false
              next2()
            }, duration + buffer)
          })
        })
      }

      function next2 () {
        waitForUpdate(() => {
          expect(vm.$el.children.length).toBe(1)
          expect(vm.$el.textContent).toBe('component A')
          expect(vm.$el.children[0].className).toBe('test-anim-leave test-anim-leave-active')
        }).thenWaitFor(nextFrame).then(() => {
          expect(vm.$el.children[0].className).toBe('test-anim-leave-active test-anim-leave-to')
        }).thenWaitFor(duration + buffer).then(() => {
          expect(vm.$el.children.length).toBe(1)
          expect(vm.$el.textContent).toBe('component B')
          expect(vm.$el.children[0].className).toMatch('test-anim-enter-active')
        }).thenWaitFor(duration * 2).then(() => {
          expect(vm.$el.children[0].className).toBe('')
        }).then(done)
      }
    })

    it('transition out-in on async component (resolve after leave complete)', done => {
      const vm = new Vue({
        template: `
          <div>
            <transition name="test-anim" mode="out-in">
              <component-a v-if="ok"></component-a>
              <component-b v-else></component-b>
            </transition>
          </div>
        `,
        components: {
          componentA: { template: '<div><h1>component A</h1></div>' },
          componentB: resolve => {
            setTimeout(() => {
              resolve({ template: '<div><h1>component B</h1></div>' })
              Vue.nextTick(next)
            }, (duration + buffer) * 1.5)
          }
        },
        data: {
          ok: true
        }
      }).$mount(el)

      expect(vm.$el.innerHTML).toBe('<div><h1>component A</h1></div>')

      let next

      vm.ok = false
      waitForUpdate(() => {
        expect(vm.$el.children.length).toBe(1)
        expect(vm.$el.textContent).toBe('component A')
        expect(vm.$el.children[0].className).toBe('test-anim-leave test-anim-leave-active')
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.children[0].className).toBe('test-anim-leave-active test-anim-leave-to')
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.children.length).toBe(0)
        expect(vm.$el.innerHTML).toBe('<!---->')
      }).thenWaitFor(_next => { next = _next }).then(() => {
        expect(vm.$el.children.length).toBe(1)
        expect(vm.$el.textContent).toBe('component B')
        expect(vm.$el.children[0].className).toBe('test-anim-enter test-anim-enter-active')
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.children[0].className).toBe('test-anim-enter-active test-anim-enter-to')
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.children.length).toBe(1)
        expect(vm.$el.textContent).toBe('component B')
        expect(vm.$el.children[0].className).toBe('')
      }).then(done)
    })

    it('transition in-out on async component', done => {
      const vm = new Vue({
        template: `
          <div>
            <transition name="test-anim" mode="in-out">
              <component-a v-if="ok"></component-a>
              <component-b v-else></component-b>
            </transition>
          </div>
        `,
        components: {
          componentA: resolve => {
            setTimeout(() => {
              resolve({ template: '<div><h1>component A</h1></div>' })
              next1()
            }, duration / 2)
          },
          componentB: resolve => {
            setTimeout(() => {
              resolve({ template: '<div><h1>component B</h1></div>' })
              next2()
            }, duration / 2)
          }
        },
        data: {
          ok: true
        }
      }).$mount(el)

      expect(vm.$el.innerHTML).toBe('<!---->')

      function next1 () {
        Vue.nextTick(() => {
          expect(vm.$el.children.length).toBe(1)
          expect(vm.$el.textContent).toBe('component A')
          expect(vm.$el.children[0].className).toBe('test-anim-enter test-anim-enter-active')
          nextFrame(() => {
            expect(vm.$el.children[0].className).toBe('test-anim-enter-active test-anim-enter-to')
            setTimeout(() => {
              expect(vm.$el.children[0].className).toBe('')
              vm.ok = false
            }, duration + buffer)
          })
        })
      }

      function next2 () {
        waitForUpdate(() => {
          expect(vm.$el.children.length).toBe(2)
          expect(vm.$el.textContent).toBe('component Acomponent B')
          expect(vm.$el.children[0].className).toBe('')
          expect(vm.$el.children[1].className).toBe('test-anim-enter test-anim-enter-active')
        }).thenWaitFor(nextFrame).then(() => {
          expect(vm.$el.children[1].className).toBe('test-anim-enter-active test-anim-enter-to')
        }).thenWaitFor(duration + buffer).then(() => {
          expect(vm.$el.children.length).toBe(2)
          expect(vm.$el.textContent).toBe('component Acomponent B')
          expect(vm.$el.children[0].className).toMatch('test-anim-leave-active')
          expect(vm.$el.children[1].className).toBe('')
        }).thenWaitFor(duration + buffer).then(() => {
          expect(vm.$el.children.length).toBe(1)
          expect(vm.$el.textContent).toBe('component B')
          expect(vm.$el.children[0].className).toBe('')
        }).then(done)
      }
    })

    it('warn invalid mode', () => {
      new Vue({
        template: '<transition mode="foo"><div>123</div></transition>'
      }).$mount()
      expect('invalid <transition> mode: foo').toHaveBeenWarned()
    })
  })
}
