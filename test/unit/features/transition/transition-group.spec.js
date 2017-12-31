import Vue from 'vue'
import injectStyles from './inject-styles'
import { isIE9 } from 'core/util/env'
import { nextFrame } from 'web/runtime/transition-util'

if (!isIE9) {
  describe('Transition group', () => {
    const { duration, buffer } = injectStyles()

    let el
    beforeEach(() => {
      el = document.createElement('div')
      document.body.appendChild(el)
    })

    function createBasicVM (useIs, appear) {
      const vm = new Vue({
        template: `
          <div>
            ${useIs ? `<span is="transition-group">` : `<transition-group${appear ? ` appear` : ``}>`}
              <div v-for="item in items" :key="item" class="test">{{ item }}</div>
            ${useIs ? `</span>` : `</transition-group>`}
          </div>
        `,
        data: {
          items: ['a', 'b', 'c']
        }
      }).$mount(el)
      if (!appear) {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            vm.items.map(i => `<div class="test">${i}</div>`).join('') +
          `</span>`
        )
      }
      return vm
    }

    it('enter', done => {
      const vm = createBasicVM()
      vm.items.push('d', 'e')
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            ['a', 'b', 'c'].map(i => `<div class="test">${i}</div>`).join('') +
            `<div class="test v-enter v-enter-active">d</div>` +
            `<div class="test v-enter v-enter-active">e</div>` +
          `</span>`
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            ['a', 'b', 'c'].map(i => `<div class="test">${i}</div>`).join('') +
            `<div class="test v-enter-active v-enter-to">d</div>` +
            `<div class="test v-enter-active v-enter-to">e</div>` +
          `</span>`
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            vm.items.map(i => `<div class="test">${i}</div>`).join('') +
          `</span>`
        )
      }).then(done)
    })

    it('leave', done => {
      const vm = createBasicVM()
      vm.items = ['b']
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            `<div class="test v-leave v-leave-active">a</div>` +
            `<div class="test">b</div>` +
            `<div class="test v-leave v-leave-active">c</div>` +
          `</span>`
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            `<div class="test v-leave-active v-leave-to">a</div>` +
            `<div class="test">b</div>` +
            `<div class="test v-leave-active v-leave-to">c</div>` +
          `</span>`
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            vm.items.map(i => `<div class="test">${i}</div>`).join('') +
          `</span>`
        )
      }).then(done)
    })

    it('enter + leave', done => {
      const vm = createBasicVM()
      vm.items = ['b', 'c', 'd']
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            `<div class="test v-leave v-leave-active">a</div>` +
            `<div class="test">b</div>` +
            `<div class="test">c</div>` +
            `<div class="test v-enter v-enter-active">d</div>` +
          `</span>`
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            `<div class="test v-leave-active v-leave-to">a</div>` +
            `<div class="test">b</div>` +
            `<div class="test">c</div>` +
            `<div class="test v-enter-active v-enter-to">d</div>` +
          `</span>`
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            vm.items.map(i => `<div class="test">${i}</div>`).join('') +
          `</span>`
        )
      }).then(done)
    })

    it('use with "is" attribute', done => {
      const vm = createBasicVM(true)
      vm.items = ['b', 'c', 'd']
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            `<div class="test v-leave v-leave-active">a</div>` +
            `<div class="test">b</div>` +
            `<div class="test">c</div>` +
            `<div class="test v-enter v-enter-active">d</div>` +
          `</span>`
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            `<div class="test v-leave-active v-leave-to">a</div>` +
            `<div class="test">b</div>` +
            `<div class="test">c</div>` +
            `<div class="test v-enter-active v-enter-to">d</div>` +
          `</span>`
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            vm.items.map(i => `<div class="test">${i}</div>`).join('') +
          `</span>`
        )
      }).then(done)
    })

    it('appear', done => {
      const vm = createBasicVM(false, true /* appear */)
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            vm.items.map(i => `<div class="test v-enter v-enter-active">${i}</div>`).join('') +
          `</span>`
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            vm.items.map(i => `<div class="test v-enter-active v-enter-to">${i}</div>`).join('') +
          `</span>`
        )
      }).thenWaitFor(duration + buffer).then(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            vm.items.map(i => `<div class="test">${i}</div>`).join('') +
          `</span>`
        )
      }).then(done)
    })

    it('events', done => {
      let next
      const beforeEnterSpy = jasmine.createSpy()
      const afterEnterSpy = jasmine.createSpy()
      const afterLeaveSpy = jasmine.createSpy()
      const vm = new Vue({
        template: `
          <div>
            <transition-group @before-enter="beforeEnter" @after-enter="afterEnter" @after-leave="afterLeave">
              <div v-for="item in items" :key="item" class="test">{{ item }}</div>
            </transition-group>
          </div>
        `,
        data: {
          items: ['a', 'b', 'c']
        },
        methods: {
          beforeEnter (el) {
            expect(el.textContent).toBe('d')
            beforeEnterSpy()
          },
          afterEnter (el) {
            expect(el.textContent).toBe('d')
            afterEnterSpy()
            next()
          },
          afterLeave (el) {
            expect(el.textContent).toBe('a')
            afterLeaveSpy()
            next()
          }
        }
      }).$mount(el)

      vm.items.push('d')
      waitForUpdate(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            `<div class="test">a</div>` +
            `<div class="test">b</div>` +
            `<div class="test">c</div>` +
            `<div class="test v-enter v-enter-active">d</div>` +
          `</span>`
        )
        expect(beforeEnterSpy.calls.count()).toBe(1)
      }).thenWaitFor(_next => { next = _next }).then(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            `<div class="test">a</div>` +
            `<div class="test">b</div>` +
            `<div class="test">c</div>` +
            `<div class="test">d</div>` +
          `</span>`
        )
        expect(afterEnterSpy.calls.count()).toBe(1)
        vm.items.shift()
      }).thenWaitFor(_next => { next = _next }).then(() => {
        expect(vm.$el.innerHTML).toBe(
          `<span>` +
            `<div class="test">b</div>` +
            `<div class="test">c</div>` +
            `<div class="test">d</div>` +
          `</span>`
        )
        expect(afterLeaveSpy.calls.count()).toBe(1)
      }).then(done)
    })

    it('move', done => {
      const vm = new Vue({
        template: `
          <div>
            <transition-group name="group">
              <div v-for="item in items" :key="item" class="test">{{ item }}</div>
            </transition-group>
          </div>
        `,
        data: {
          items: ['a', 'b', 'c']
        }
      }).$mount(el)

      vm.items = ['d', 'b', 'a']
      waitForUpdate(() => {
        expect(vm.$el.innerHTML.replace(/\s?style=""(\s?)/g, '$1')).toBe(
          `<span>` +
            `<div class="test group-enter group-enter-active">d</div>` +
            `<div class="test">b</div>` +
            `<div class="test group-move">a</div>` +
            `<div class="test group-leave group-leave-active group-move">c</div>` +
          `</span>`
        )
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML.replace(/\s?style=""(\s?)/g, '$1')).toBe(
          `<span>` +
            `<div class="test group-enter-active group-enter-to">d</div>` +
            `<div class="test">b</div>` +
            `<div class="test group-move">a</div>` +
            `<div class="test group-leave-active group-move group-leave-to">c</div>` +
          `</span>`
        )
      }).thenWaitFor(duration * 2).then(() => {
        expect(vm.$el.innerHTML.replace(/\s?style=""(\s?)/g, '$1')).toBe(
          `<span>` +
            `<div class="test">d</div>` +
            `<div class="test">b</div>` +
            `<div class="test">a</div>` +
          `</span>`
        )
      }).then(done)
    })

    it('warn unkeyed children', () => {
      new Vue({
        template: `<div><transition-group><div v-for="i in 3"></div></transition-group></div>`
      }).$mount()
      expect('<transition-group> children must be keyed: <div>').toHaveBeenWarned()
    })

    // GitHub issue #6006
    it('should work with dynamic name', done => {
      const vm = new Vue({
        template: `
          <div>
            <transition-group :name="name">
              <div v-for="item in items" :key="item">{{ item }}</div>
            </transition-group>
          </div>
        `,
        data: {
          items: ['a', 'b', 'c'],
          name: 'group'
        }
      }).$mount(el)

      vm.name = 'invalid-name'
      vm.items = ['b', 'c', 'a']
      waitForUpdate(() => {
        expect(vm.$el.innerHTML.replace(/\s?style=""(\s?)/g, '$1')).toBe(
          `<span>` +
            `<div>b</div>` +
            `<div>c</div>` +
            `<div>a</div>` +
          `</span>`
        )
        vm.name = 'group'
        vm.items = ['a', 'b', 'c']
      }).thenWaitFor(nextFrame).then(() => {
        expect(vm.$el.innerHTML.replace(/\s?style=""(\s?)/g, '$1')).toBe(
          `<span>` +
            `<div class="group-move">a</div>` +
            `<div class="group-move">b</div>` +
            `<div class="group-move">c</div>` +
          `</span>`
        )
      }).thenWaitFor(duration * 2 + buffer).then(() => {
        expect(vm.$el.innerHTML.replace(/\s?style=""(\s?)/g, '$1')).toBe(
          `<span>` +
            `<div>a</div>` +
            `<div>b</div>` +
            `<div>c</div>` +
          `</span>`
        )
      }).then(done)
    })
  })
}
