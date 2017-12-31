import Vue from 'vue'
import { supportsPassive } from 'core/util/env'

describe('Directive v-on', () => {
  let vm, spy, el

  beforeEach(() => {
    vm = null
    spy = jasmine.createSpy()
    el = document.createElement('div')
    document.body.appendChild(el)
  })

  afterEach(() => {
    if (vm) {
      document.body.removeChild(vm.$el)
    }
  })

  it('should bind event to a method', () => {
    vm = new Vue({
      el,
      template: '<div v-on:click="foo"></div>',
      methods: { foo: spy }
    })
    triggerEvent(vm.$el, 'click')
    expect(spy.calls.count()).toBe(1)

    const args = spy.calls.allArgs()
    const event = args[0] && args[0][0] || {}
    expect(event.type).toBe('click')
  })

  it('should bind event to a inline statement', () => {
    vm = new Vue({
      el,
      template: '<div v-on:click="foo(1,2,3,$event)"></div>',
      methods: { foo: spy }
    })
    triggerEvent(vm.$el, 'click')
    expect(spy.calls.count()).toBe(1)

    const args = spy.calls.allArgs()
    const firstArgs = args[0]
    expect(firstArgs.length).toBe(4)
    expect(firstArgs[0]).toBe(1)
    expect(firstArgs[1]).toBe(2)
    expect(firstArgs[2]).toBe(3)
    expect(firstArgs[3].type).toBe('click')
  })

  it('should support inline function expression', () => {
    const spy = jasmine.createSpy()
    vm = new Vue({
      el,
      template: `<div class="test" @click="function (e) { log(e.target.className) }"></div>`,
      methods: {
        log: spy
      }
    }).$mount()
    triggerEvent(vm.$el, 'click')
    expect(spy).toHaveBeenCalledWith('test')
  })

  it('should support shorthand', () => {
    vm = new Vue({
      el,
      template: '<a href="#test" @click.prevent="foo"></a>',
      methods: { foo: spy }
    })
    triggerEvent(vm.$el, 'click')
    expect(spy.calls.count()).toBe(1)
  })

  it('should support stop propagation', () => {
    vm = new Vue({
      el,
      template: `
        <div @click.stop="foo"></div>
      `,
      methods: { foo: spy }
    })
    const hash = window.location.hash
    triggerEvent(vm.$el, 'click')
    expect(window.location.hash).toBe(hash)
  })

  it('should support prevent default', () => {
    vm = new Vue({
      el,
      template: `
        <input type="checkbox" ref="input" @click.prevent="foo">
      `,
      methods: {
        foo ($event) {
          spy($event.defaultPrevented)
        }
      }
    })
    vm.$refs.input.checked = false
    triggerEvent(vm.$refs.input, 'click')
    expect(spy).toHaveBeenCalledWith(true)
  })

  it('should support capture', () => {
    const callOrder = []
    vm = new Vue({
      el,
      template: `
        <div @click.capture="foo">
          <div @click="bar"></div>
        </div>
      `,
      methods: {
        foo () { callOrder.push(1) },
        bar () { callOrder.push(2) }
      }
    })
    triggerEvent(vm.$el.firstChild, 'click')
    expect(callOrder.toString()).toBe('1,2')
  })

  it('should support once', () => {
    vm = new Vue({
      el,
      template: `
        <div @click.once="foo">
        </div>
      `,
      methods: { foo: spy }
    })
    triggerEvent(vm.$el, 'click')
    expect(spy.calls.count()).toBe(1)
    triggerEvent(vm.$el, 'click')
    expect(spy.calls.count()).toBe(1) // should no longer trigger
  })

  // #4655
  it('should handle .once on multiple elements properly', () => {
    vm = new Vue({
      el,
      template: `
        <div>
          <button ref="one" @click.once="foo">one</button>
          <button ref="two" @click.once="foo">two</button>
        </div>
      `,
      methods: { foo: spy }
    })
    triggerEvent(vm.$refs.one, 'click')
    expect(spy.calls.count()).toBe(1)
    triggerEvent(vm.$refs.one, 'click')
    expect(spy.calls.count()).toBe(1)
    triggerEvent(vm.$refs.two, 'click')
    expect(spy.calls.count()).toBe(2)
    triggerEvent(vm.$refs.one, 'click')
    triggerEvent(vm.$refs.two, 'click')
    expect(spy.calls.count()).toBe(2)
  })

  it('should support capture and once', () => {
    const callOrder = []
    vm = new Vue({
      el,
      template: `
        <div @click.capture.once="foo">
          <div @click="bar"></div>
        </div>
      `,
      methods: {
        foo () { callOrder.push(1) },
        bar () { callOrder.push(2) }
      }
    })
    triggerEvent(vm.$el.firstChild, 'click')
    expect(callOrder.toString()).toBe('1,2')
    triggerEvent(vm.$el.firstChild, 'click')
    expect(callOrder.toString()).toBe('1,2,2')
  })

  // #4846
  it('should support once and other modifiers', () => {
    vm = new Vue({
      el,
      template: `<div @click.once.self="foo"><span/></div>`,
      methods: { foo: spy }
    })
    triggerEvent(vm.$el.firstChild, 'click')
    expect(spy).not.toHaveBeenCalled()
    triggerEvent(vm.$el, 'click')
    expect(spy).toHaveBeenCalled()
    triggerEvent(vm.$el, 'click')
    expect(spy.calls.count()).toBe(1)
  })

  it('should support keyCode', () => {
    vm = new Vue({
      el,
      template: `<input @keyup.enter="foo">`,
      methods: { foo: spy }
    })
    triggerEvent(vm.$el, 'keyup', e => {
      e.keyCode = 13
    })
    expect(spy).toHaveBeenCalled()
  })

  it('should support automatic key name inference', () => {
    vm = new Vue({
      el,
      template: `<input @keyup.arrow-right="foo">`,
      methods: { foo: spy }
    })
    triggerEvent(vm.$el, 'keyup', e => {
      e.key = 'ArrowRight'
    })
    expect(spy).toHaveBeenCalled()
  })

  // ctrl, shift, alt, meta
  it('should support system modifers', () => {
    vm = new Vue({
      el,
      template: `
        <div>
          <input ref="ctrl" @keyup.ctrl="foo">
          <input ref="shift" @keyup.shift="foo">
          <input ref="alt" @keyup.alt="foo">
          <input ref="meta" @keyup.meta="foo">
        </div>
      `,
      methods: { foo: spy }
    })

    triggerEvent(vm.$refs.ctrl, 'keyup')
    expect(spy.calls.count()).toBe(0)
    triggerEvent(vm.$refs.ctrl, 'keyup', e => { e.ctrlKey = true })
    expect(spy.calls.count()).toBe(1)

    triggerEvent(vm.$refs.shift, 'keyup')
    expect(spy.calls.count()).toBe(1)
    triggerEvent(vm.$refs.shift, 'keyup', e => { e.shiftKey = true })
    expect(spy.calls.count()).toBe(2)

    triggerEvent(vm.$refs.alt, 'keyup')
    expect(spy.calls.count()).toBe(2)
    triggerEvent(vm.$refs.alt, 'keyup', e => { e.altKey = true })
    expect(spy.calls.count()).toBe(3)

    triggerEvent(vm.$refs.meta, 'keyup')
    expect(spy.calls.count()).toBe(3)
    triggerEvent(vm.$refs.meta, 'keyup', e => { e.metaKey = true })
    expect(spy.calls.count()).toBe(4)
  })

  it('should support exact modifier', () => {
    vm = new Vue({
      el,
      template: `
        <div>
          <input ref="ctrl" @keyup.exact="foo">
        </div>
      `,
      methods: { foo: spy }
    })

    triggerEvent(vm.$refs.ctrl, 'keyup')
    expect(spy.calls.count()).toBe(1)

    triggerEvent(vm.$refs.ctrl, 'keyup', e => {
      e.ctrlKey = true
    })
    expect(spy.calls.count()).toBe(1)

    // should not trigger if has other system modifiers
    triggerEvent(vm.$refs.ctrl, 'keyup', e => {
      e.ctrlKey = true
      e.altKey = true
    })
    expect(spy.calls.count()).toBe(1)
  })

  it('should support system modifers with exact', () => {
    vm = new Vue({
      el,
      template: `
        <div>
          <input ref="ctrl" @keyup.ctrl.exact="foo">
        </div>
      `,
      methods: { foo: spy }
    })

    triggerEvent(vm.$refs.ctrl, 'keyup')
    expect(spy.calls.count()).toBe(0)

    triggerEvent(vm.$refs.ctrl, 'keyup', e => {
      e.ctrlKey = true
    })
    expect(spy.calls.count()).toBe(1)

    // should not trigger if has other system modifiers
    triggerEvent(vm.$refs.ctrl, 'keyup', e => {
      e.ctrlKey = true
      e.altKey = true
    })
    expect(spy.calls.count()).toBe(1)
  })

  it('should support number keyCode', () => {
    vm = new Vue({
      el,
      template: `<input @keyup.13="foo">`,
      methods: { foo: spy }
    })
    triggerEvent(vm.$el, 'keyup', e => {
      e.keyCode = 13
    })
    expect(spy).toHaveBeenCalled()
  })

  it('should support mouse modifier', () => {
    const left = 0
    const middle = 1
    const right = 2
    const spyLeft = jasmine.createSpy()
    const spyMiddle = jasmine.createSpy()
    const spyRight = jasmine.createSpy()

    vm = new Vue({
      el,
      template: `
        <div>
          <div ref="left" @mousedown.left="foo">left</div>
          <div ref="right" @mousedown.right="foo1">right</div>
          <div ref="middle" @mousedown.middle="foo2">right</div>
        </div>
      `,
      methods: {
        foo: spyLeft,
        foo1: spyRight,
        foo2: spyMiddle
      }
    })

    triggerEvent(vm.$refs.left, 'mousedown', e => { e.button = right })
    triggerEvent(vm.$refs.left, 'mousedown', e => { e.button = middle })
    expect(spyLeft).not.toHaveBeenCalled()
    triggerEvent(vm.$refs.left, 'mousedown', e => { e.button = left })
    expect(spyLeft).toHaveBeenCalled()

    triggerEvent(vm.$refs.right, 'mousedown', e => { e.button = left })
    triggerEvent(vm.$refs.right, 'mousedown', e => { e.button = middle })
    expect(spyRight).not.toHaveBeenCalled()
    triggerEvent(vm.$refs.right, 'mousedown', e => { e.button = right })
    expect(spyRight).toHaveBeenCalled()

    triggerEvent(vm.$refs.middle, 'mousedown', e => { e.button = left })
    triggerEvent(vm.$refs.middle, 'mousedown', e => { e.button = right })
    expect(spyMiddle).not.toHaveBeenCalled()
    triggerEvent(vm.$refs.middle, 'mousedown', e => { e.button = middle })
    expect(spyMiddle).toHaveBeenCalled()
  })

  it('should support custom keyCode', () => {
    Vue.config.keyCodes.test = 1
    vm = new Vue({
      el,
      template: `<input @keyup.test="foo">`,
      methods: { foo: spy }
    })
    triggerEvent(vm.$el, 'keyup', e => {
      e.keyCode = 1
    })
    expect(spy).toHaveBeenCalled()
    Vue.config.keyCodes = Object.create(null)
  })

  it('should override build-in keyCode', () => {
    Vue.config.keyCodes.up = [1, 87]
    vm = new Vue({
      el,
      template: `<input @keyup.up="foo" @keyup.down="foo">`,
      methods: { foo: spy }
    })
    triggerEvent(vm.$el, 'keyup', e => {
      e.keyCode = 87
    })
    expect(spy).toHaveBeenCalled()
    triggerEvent(vm.$el, 'keyup', e => {
      e.keyCode = 1
    })
    expect(spy).toHaveBeenCalledTimes(2)
    // should not affect build-in down keycode
    triggerEvent(vm.$el, 'keyup', e => {
      e.keyCode = 40
    })
    expect(spy).toHaveBeenCalledTimes(3)
    Vue.config.keyCodes = Object.create(null)
  })

  it('should bind to a child component', () => {
    vm = new Vue({
      el,
      template: '<bar @custom="foo"></bar>',
      methods: { foo: spy },
      components: {
        bar: {
          template: '<span>Hello</span>'
        }
      }
    })
    vm.$children[0].$emit('custom', 'foo', 'bar')
    expect(spy).toHaveBeenCalledWith('foo', 'bar')
  })

  it('should be able to bind native events for a child component', () => {
    vm = new Vue({
      el,
      template: '<bar @click.native="foo"></bar>',
      methods: { foo: spy },
      components: {
        bar: {
          template: '<span>Hello</span>'
        }
      }
    })
    vm.$children[0].$emit('click')
    expect(spy).not.toHaveBeenCalled()
    triggerEvent(vm.$children[0].$el, 'click')
    expect(spy).toHaveBeenCalled()
  })

  it('.once modifier should work with child components', () => {
    vm = new Vue({
      el,
      template: '<bar @custom.once="foo"></bar>',
      methods: { foo: spy },
      components: {
        bar: {
          template: '<span>Hello</span>'
        }
      }
    })
    vm.$children[0].$emit('custom')
    expect(spy.calls.count()).toBe(1)
    vm.$children[0].$emit('custom')
    expect(spy.calls.count()).toBe(1) // should not be called again
  })

  it('remove listener', done => {
    const spy2 = jasmine.createSpy('remove listener')
    vm = new Vue({
      el,
      methods: { foo: spy, bar: spy2 },
      data: {
        ok: true
      },
      render (h) {
        return this.ok
          ? h('input', { on: { click: this.foo }})
          : h('input', { on: { input: this.bar }})
      }
    })
    triggerEvent(vm.$el, 'click')
    expect(spy.calls.count()).toBe(1)
    expect(spy2.calls.count()).toBe(0)
    vm.ok = false
    waitForUpdate(() => {
      triggerEvent(vm.$el, 'click')
      expect(spy.calls.count()).toBe(1) // should no longer trigger
      triggerEvent(vm.$el, 'input')
      expect(spy2.calls.count()).toBe(1)
    }).then(done)
  })

  it('remove capturing listener', done => {
    const spy2 = jasmine.createSpy('remove listener')
    vm = new Vue({
      el,
      methods: { foo: spy, bar: spy2, stopped (ev) { ev.stopPropagation() } },
      data: {
        ok: true
      },
      render (h) {
        return this.ok
          ? h('div', { on: { '!click': this.foo }}, [h('div', { on: { click: this.stopped }})])
          : h('div', { on: { mouseOver: this.bar }}, [h('div')])
      }
    })
    triggerEvent(vm.$el.firstChild, 'click')
    expect(spy.calls.count()).toBe(1)
    expect(spy2.calls.count()).toBe(0)
    vm.ok = false
    waitForUpdate(() => {
      triggerEvent(vm.$el.firstChild, 'click')
      expect(spy.calls.count()).toBe(1) // should no longer trigger
      triggerEvent(vm.$el, 'mouseOver')
      expect(spy2.calls.count()).toBe(1)
    }).then(done)
  })

  it('remove once listener', done => {
    const spy2 = jasmine.createSpy('remove listener')
    vm = new Vue({
      el,
      methods: { foo: spy, bar: spy2 },
      data: {
        ok: true
      },
      render (h) {
        return this.ok
          ? h('input', { on: { '~click': this.foo }})
          : h('input', { on: { input: this.bar }})
      }
    })
    triggerEvent(vm.$el, 'click')
    expect(spy.calls.count()).toBe(1)
    triggerEvent(vm.$el, 'click')
    expect(spy.calls.count()).toBe(1) // should no longer trigger
    expect(spy2.calls.count()).toBe(0)
    vm.ok = false
    waitForUpdate(() => {
      triggerEvent(vm.$el, 'click')
      expect(spy.calls.count()).toBe(1) // should no longer trigger
      triggerEvent(vm.$el, 'input')
      expect(spy2.calls.count()).toBe(1)
    }).then(done)
  })

  it('remove capturing and once listener', done => {
    const spy2 = jasmine.createSpy('remove listener')
    vm = new Vue({
      el,
      methods: { foo: spy, bar: spy2, stopped (ev) { ev.stopPropagation() } },
      data: {
        ok: true
      },
      render (h) {
        return this.ok
          ? h('div', { on: { '~!click': this.foo }}, [h('div', { on: { click: this.stopped }})])
          : h('div', { on: { mouseOver: this.bar }}, [h('div')])
      }
    })
    triggerEvent(vm.$el.firstChild, 'click')
    expect(spy.calls.count()).toBe(1)
    triggerEvent(vm.$el.firstChild, 'click')
    expect(spy.calls.count()).toBe(1) // should no longer trigger
    expect(spy2.calls.count()).toBe(0)
    vm.ok = false
    waitForUpdate(() => {
      triggerEvent(vm.$el.firstChild, 'click')
      expect(spy.calls.count()).toBe(1) // should no longer trigger
      triggerEvent(vm.$el, 'mouseOver')
      expect(spy2.calls.count()).toBe(1)
    }).then(done)
  })

  it('remove listener on child component', done => {
    const spy2 = jasmine.createSpy('remove listener')
    vm = new Vue({
      el,
      methods: { foo: spy, bar: spy2 },
      data: {
        ok: true
      },
      components: {
        test: {
          template: '<div></div>'
        }
      },
      render (h) {
        return this.ok
          ? h('test', { on: { foo: this.foo }})
          : h('test', { on: { bar: this.bar }})
      }
    })
    vm.$children[0].$emit('foo')
    expect(spy.calls.count()).toBe(1)
    expect(spy2.calls.count()).toBe(0)
    vm.ok = false
    waitForUpdate(() => {
      vm.$children[0].$emit('foo')
      expect(spy.calls.count()).toBe(1) // should no longer trigger
      vm.$children[0].$emit('bar')
      expect(spy2.calls.count()).toBe(1)
    }).then(done)
  })

  it('warn missing handlers', () => {
    vm = new Vue({
      el,
      data: { none: null },
      template: `<div @click="none"></div>`
    })
    expect(`Invalid handler for event "click": got null`).toHaveBeenWarned()
    expect(() => {
      triggerEvent(vm.$el, 'click')
    }).not.toThrow()
  })

  // Github Issue #5046
  it('should support keyboard modifier for direction keys', () => {
    const spyLeft = jasmine.createSpy()
    const spyRight = jasmine.createSpy()
    const spyUp = jasmine.createSpy()
    const spyDown = jasmine.createSpy()
    vm = new Vue({
      el,
      template: `
        <div>
          <input ref="left" @keydown.left="foo"></input>
          <input ref="right" @keydown.right="foo1"></input>
          <input ref="up" @keydown.up="foo2"></input>
          <input ref="down" @keydown.down="foo3"></input>
        </div>
      `,
      methods: {
        foo: spyLeft,
        foo1: spyRight,
        foo2: spyUp,
        foo3: spyDown
      }
    })
    triggerEvent(vm.$refs.left, 'keydown', e => { e.keyCode = 37 })
    triggerEvent(vm.$refs.left, 'keydown', e => { e.keyCode = 39 })

    triggerEvent(vm.$refs.right, 'keydown', e => { e.keyCode = 39 })
    triggerEvent(vm.$refs.right, 'keydown', e => { e.keyCode = 38 })

    triggerEvent(vm.$refs.up, 'keydown', e => { e.keyCode = 38 })
    triggerEvent(vm.$refs.up, 'keydown', e => { e.keyCode = 37 })

    triggerEvent(vm.$refs.down, 'keydown', e => { e.keyCode = 40 })
    triggerEvent(vm.$refs.down, 'keydown', e => { e.keyCode = 39 })

    expect(spyLeft.calls.count()).toBe(1)
    expect(spyRight.calls.count()).toBe(1)
    expect(spyUp.calls.count()).toBe(1)
    expect(spyDown.calls.count()).toBe(1)
  })

  // This test case should only run when the test browser supports passive.
  if (supportsPassive) {
    it('should support passive', () => {
      vm = new Vue({
        el,
        template: `
          <div>
            <input type="checkbox" ref="normal" @click="foo"/>
            <input type="checkbox" ref="passive" @click.passive="foo"/>
            <input type="checkbox" ref="exclusive" @click.prevent.passive/>
          </div>
        `,
        methods: {
          foo (e) {
            e.preventDefault()
          }
        }
      })

      vm.$refs.normal.checked = false
      vm.$refs.passive.checked = false
      vm.$refs.exclusive.checked = false
      vm.$refs.normal.click()
      vm.$refs.passive.click()
      vm.$refs.exclusive.click()
      expect(vm.$refs.normal.checked).toBe(false)
      expect(vm.$refs.passive.checked).toBe(true)
      expect(vm.$refs.exclusive.checked).toBe(true)
      expect('passive and prevent can\'t be used together. Passive handler can\'t prevent default event.').toHaveBeenWarned()
    })
  }

  // GitHub Issues #5146
  it('should only prevent when match keycode', () => {
    let prevented = false
    vm = new Vue({
      el,
      template: `
        <input ref="input" @keydown.enter.prevent="foo">
      `,
      methods: {
        foo ($event) {
          prevented = $event.defaultPrevented
        }
      }
    })

    triggerEvent(vm.$refs.input, 'keydown', e => { e.keyCode = 32 })
    expect(prevented).toBe(false)
    triggerEvent(vm.$refs.input, 'keydown', e => { e.keyCode = 13 })
    expect(prevented).toBe(true)
  })

  it('should transform click.right to contextmenu', () => {
    const spy = jasmine.createSpy('click.right')
    const vm = new Vue({
      template: `<div @click.right="foo"></div>`,
      methods: { foo: spy }
    }).$mount()

    triggerEvent(vm.$el, 'contextmenu')
    expect(spy).toHaveBeenCalled()
  })

  it('should transform click.middle to mouseup', () => {
    const spy = jasmine.createSpy('click.middle')
    const vm = new Vue({
      template: `<div @click.middle="foo"></div>`,
      methods: { foo: spy }
    }).$mount()
    triggerEvent(vm.$el, 'mouseup', e => { e.button = 0 })
    expect(spy).not.toHaveBeenCalled()
    triggerEvent(vm.$el, 'mouseup', e => { e.button = 1 })
    expect(spy).toHaveBeenCalled()
  })

  it('object syntax (no argument)', () => {
    const click = jasmine.createSpy('click')
    const mouseup = jasmine.createSpy('mouseup')
    vm = new Vue({
      el,
      template: `<button v-on="listeners">foo</button>`,
      created () {
        this.listeners = {
          click,
          mouseup
        }
      }
    })

    triggerEvent(vm.$el, 'click')
    expect(click.calls.count()).toBe(1)
    expect(mouseup.calls.count()).toBe(0)

    triggerEvent(vm.$el, 'mouseup')
    expect(click.calls.count()).toBe(1)
    expect(mouseup.calls.count()).toBe(1)
  })

  it('object syntax (no argument, mixed with normal listeners)', () => {
    const click1 = jasmine.createSpy('click1')
    const click2 = jasmine.createSpy('click2')
    const mouseup = jasmine.createSpy('mouseup')
    vm = new Vue({
      el,
      template: `<button v-on="listeners" @click="click2">foo</button>`,
      created () {
        this.listeners = {
          click: click1,
          mouseup
        }
      },
      methods: {
        click2
      }
    })

    triggerEvent(vm.$el, 'click')
    expect(click1.calls.count()).toBe(1)
    expect(click2.calls.count()).toBe(1)
    expect(mouseup.calls.count()).toBe(0)

    triggerEvent(vm.$el, 'mouseup')
    expect(click1.calls.count()).toBe(1)
    expect(click2.calls.count()).toBe(1)
    expect(mouseup.calls.count()).toBe(1)
  })

  it('object syntax (usage in HOC, mixed with native listeners)', () => {
    const click = jasmine.createSpy('click')
    const mouseup = jasmine.createSpy('mouseup')
    const mousedown = jasmine.createSpy('mousedown')

    vm = new Vue({
      el,
      template: `
        <foo-button
          @click="click"
          @mousedown="mousedown"
          @mouseup.native="mouseup">
        </foo-button>
      `,
      methods: {
        click,
        mouseup,
        mousedown
      },
      components: {
        fooButton: {
          template: `
            <button v-on="$listeners"></button>
          `
        }
      }
    })

    triggerEvent(vm.$el, 'click')
    expect(click.calls.count()).toBe(1)
    expect(mouseup.calls.count()).toBe(0)
    expect(mousedown.calls.count()).toBe(0)

    triggerEvent(vm.$el, 'mouseup')
    expect(click.calls.count()).toBe(1)
    expect(mouseup.calls.count()).toBe(1)
    expect(mousedown.calls.count()).toBe(0)

    triggerEvent(vm.$el, 'mousedown')
    expect(click.calls.count()).toBe(1)
    expect(mouseup.calls.count()).toBe(1)
    expect(mousedown.calls.count()).toBe(1)
  })

  // #6805 (v-on="object" bind order problem)
  it('object syntax (no argument): should fire after high-priority listeners', done => {
    const MyCheckbox = {
      template: '<input type="checkbox" v-model="model" v-on="$listeners">',
      props: {
        value: false
      },
      computed: {
        model: {
          get () {
            return this.value
          },
          set (val) {
            this.$emit('input', val)
          }
        }
      }
    }

    vm = new Vue({
      el,
      template: `
        <div>
          <my-checkbox v-model="check" @change="change"></my-checkbox>
        </div>
      `,
      components: { MyCheckbox },
      data: {
        check: false
      },
      methods: {
        change () {
          expect(this.check).toBe(true)
          done()
        }
      }
    })

    vm.$el.querySelector('input').click()
  })

  it('warn object syntax with modifier', () => {
    new Vue({
      template: `<button v-on.self="{}"></button>`
    }).$mount()
    expect(`v-on without argument does not support modifiers`).toHaveBeenWarned()
  })

  it('warn object syntax with non-object value', () => {
    new Vue({
      template: `<button v-on="123"></button>`
    }).$mount()
    expect(`v-on without argument expects an Object value`).toHaveBeenWarned()
  })
})
