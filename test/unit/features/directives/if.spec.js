import Vue from 'vue'

describe('Directive v-if', () => {
  it('should check if value is truthy', () => {
    const vm = new Vue({
      template: '<div><span v-if="foo">hello</span></div>',
      data: { foo: true }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>hello</span>')
  })

  it('should check if value is falsy', () => {
    const vm = new Vue({
      template: '<div><span v-if="foo">hello</span></div>',
      data: { foo: false }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<!---->')
  })

  it('should update if value changed', done => {
    const vm = new Vue({
      template: '<div><span v-if="foo">hello</span></div>',
      data: { foo: true }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>hello</span>')
    vm.foo = false
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<!---->')
      vm.foo = {}
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>hello</span>')
      vm.foo = 0
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<!---->')
      vm.foo = []
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>hello</span>')
      vm.foo = null
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<!---->')
      vm.foo = '0'
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>hello</span>')
      vm.foo = undefined
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<!---->')
      vm.foo = 1
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>hello</span>')
    }).then(done)
  })

  it('should work well with v-else', done => {
    const vm = new Vue({
      template: `
        <div>
          <span v-if="foo">hello</span>
          <span v-else>bye</span>
        </div>
      `,
      data: { foo: true }
    }).$mount()
    expect(vm.$el.innerHTML.trim()).toBe('<span>hello</span>')
    vm.foo = false
    waitForUpdate(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.foo = {}
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>hello</span>')
      vm.foo = 0
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.foo = []
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>hello</span>')
      vm.foo = null
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.foo = '0'
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>hello</span>')
      vm.foo = undefined
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.foo = 1
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>hello</span>')
    }).then(done)
  })

  it('should work well with v-else-if', done => {
    const vm = new Vue({
      template: `
        <div>
          <span v-if="foo">hello</span>
          <span v-else-if="bar">elseif</span>
          <span v-else>bye</span>
        </div>
      `,
      data: { foo: true, bar: false }
    }).$mount()
    expect(vm.$el.innerHTML.trim()).toBe('<span>hello</span>')
    vm.foo = false
    waitForUpdate(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.bar = true
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>elseif</span>')
      vm.bar = false
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.foo = true
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>hello</span>')
      vm.foo = false
      vm.bar = {}
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>elseif</span>')
      vm.bar = 0
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.bar = []
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>elseif</span>')
      vm.bar = null
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.bar = '0'
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>elseif</span>')
      vm.bar = undefined
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.bar = 1
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>elseif</span>')
    }).then(done)
  })

  it('should work well with v-for', done => {
    const vm = new Vue({
      template: `
        <div>
          <span v-for="(item, i) in list" v-if="item.value">{{i}}</span>
        </div>
      `,
      data: {
        list: [
          { value: true },
          { value: false },
          { value: true }
        ]
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>0</span><!----><span>2</span>')
    vm.list[0].value = false
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<!----><!----><span>2</span>')
      vm.list.push({ value: true })
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<!----><!----><span>2</span><span>3</span>')
      vm.list.splice(1, 2)
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<!----><span>1</span>')
    }).then(done)
  })

  it('should work well with v-for and v-else', done => {
    const vm = new Vue({
      template: `
        <div>
          <span v-for="(item, i) in list" v-if="item.value">hello</span>
          <span v-else>bye</span>
        </div>
      `,
      data: {
        list: [
          { value: true },
          { value: false },
          { value: true }
        ]
      }
    }).$mount()
    expect(vm.$el.innerHTML.trim()).toBe('<span>hello</span><span>bye</span><span>hello</span>')
    vm.list[0].value = false
    waitForUpdate(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span><span>bye</span><span>hello</span>')
      vm.list.push({ value: true })
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span><span>bye</span><span>hello</span><span>hello</span>')
      vm.list.splice(1, 2)
    }).then(() => {
      expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span><span>hello</span>')
    }).then(done)
  })

  it('should work with v-for on v-else branch', done => {
    const vm = new Vue({
      template: `
        <div>
          <span v-if="false">hello</span>
          <span v-else v-for="item in list">{{ item }}</span>
        </div>
      `,
      data: {
        list: [1, 2, 3]
      }
    }).$mount()
    expect(vm.$el.textContent.trim()).toBe('123')
    vm.list.reverse()
    waitForUpdate(() => {
      expect(vm.$el.textContent.trim()).toBe('321')
    }).then(done)
  })

  it('should work properly on component root', done => {
    const vm = new Vue({
      template: `
        <div>
          <test class="test"></test>
        </div>
      `,
      components: {
        test: {
          data () {
            return { ok: true }
          },
          template: '<div v-if="ok" id="ok" class="inner">test</div>'
        }
      }
    }).$mount()
    expect(vm.$el.children[0].id).toBe('ok')
    expect(vm.$el.children[0].className).toBe('inner test')
    vm.$children[0].ok = false
    waitForUpdate(() => {
      // attrs / class modules should not attempt to patch the comment node
      expect(vm.$el.innerHTML).toBe('<!---->')
      vm.$children[0].ok = true
    }).then(() => {
      expect(vm.$el.children[0].id).toBe('ok')
      expect(vm.$el.children[0].className).toBe('inner test')
    }).then(done)
  })

  it('should maintain stable list to avoid unnecessary patches', done => {
    const created = jasmine.createSpy()
    const destroyed = jasmine.createSpy()
    const vm = new Vue({
      data: {
        ok: true
      },
      // when the first div is toggled, the second div should be reused
      // instead of re-created/destroyed
      template: `
        <div>
          <div v-if="ok"></div>
          <div><test></test></div>
        </div>
      `,
      components: {
        test: {
          template: '<div></div>',
          created,
          destroyed
        }
      }
    }).$mount()

    expect(created.calls.count()).toBe(1)
    vm.ok = false
    waitForUpdate(() => {
      expect(created.calls.count()).toBe(1)
      expect(destroyed).not.toHaveBeenCalled()
    }).then(done)
  })
})
