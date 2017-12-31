import Vue from 'vue'

describe('Directive v-for', () => {
  it('should render array of primitive values', done => {
    const vm = new Vue({
      template: `
        <div>
          <span v-for="item in list">{{item}}</span>
        </div>
      `,
      data: {
        list: ['a', 'b', 'c']
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>a</span><span>b</span><span>c</span>')
    Vue.set(vm.list, 0, 'd')
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<span>d</span><span>b</span><span>c</span>')
      vm.list.push('d')
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>d</span><span>b</span><span>c</span><span>d</span>')
      vm.list.splice(1, 2)
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>d</span><span>d</span>')
      vm.list = ['x', 'y']
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>x</span><span>y</span>')
    }).then(done)
  })

  it('should render array of primitive values with index', done => {
    const vm = new Vue({
      template: `
        <div>
          <span v-for="(item, i) in list">{{i}}-{{item}}</span>
        </div>
      `,
      data: {
        list: ['a', 'b', 'c']
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>0-a</span><span>1-b</span><span>2-c</span>')
    Vue.set(vm.list, 0, 'd')
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<span>0-d</span><span>1-b</span><span>2-c</span>')
      vm.list.push('d')
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>0-d</span><span>1-b</span><span>2-c</span><span>3-d</span>')
      vm.list.splice(1, 2)
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>0-d</span><span>1-d</span>')
      vm.list = ['x', 'y']
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>0-x</span><span>1-y</span>')
    }).then(done)
  })

  it('should render array of object values', done => {
    const vm = new Vue({
      template: `
        <div>
          <span v-for="item in list">{{item.value}}</span>
        </div>
      `,
      data: {
        list: [
          { value: 'a' },
          { value: 'b' },
          { value: 'c' }
        ]
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>a</span><span>b</span><span>c</span>')
    Vue.set(vm.list, 0, { value: 'd' })
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<span>d</span><span>b</span><span>c</span>')
      vm.list[0].value = 'e'
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>e</span><span>b</span><span>c</span>')
      vm.list.push({})
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>e</span><span>b</span><span>c</span><span></span>')
      vm.list.splice(1, 2)
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>e</span><span></span>')
      vm.list = [{ value: 'x' }, { value: 'y' }]
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>x</span><span>y</span>')
    }).then(done)
  })

  it('should render array of object values with index', done => {
    const vm = new Vue({
      template: `
        <div>
          <span v-for="(item, i) in list">{{i}}-{{item.value}}</span>
        </div>
      `,
      data: {
        list: [
          { value: 'a' },
          { value: 'b' },
          { value: 'c' }
        ]
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>0-a</span><span>1-b</span><span>2-c</span>')
    Vue.set(vm.list, 0, { value: 'd' })
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<span>0-d</span><span>1-b</span><span>2-c</span>')
      vm.list[0].value = 'e'
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>0-e</span><span>1-b</span><span>2-c</span>')
      vm.list.push({})
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>0-e</span><span>1-b</span><span>2-c</span><span>3-</span>')
      vm.list.splice(1, 2)
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>0-e</span><span>1-</span>')
      vm.list = [{ value: 'x' }, { value: 'y' }]
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>0-x</span><span>1-y</span>')
    }).then(done)
  })

  it('should render an Object', done => {
    const vm = new Vue({
      template: `
        <div>
          <span v-for="val in obj">{{val}}</span>
        </div>
      `,
      data: {
        obj: { a: 0, b: 1, c: 2 }
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>0</span><span>1</span><span>2</span>')
    vm.obj.a = 3
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<span>3</span><span>1</span><span>2</span>')
      Vue.set(vm.obj, 'd', 4)
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>3</span><span>1</span><span>2</span><span>4</span>')
      Vue.delete(vm.obj, 'a')
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>1</span><span>2</span><span>4</span>')
    }).then(done)
  })

  it('should render an Object with key', done => {
    const vm = new Vue({
      template: `
        <div>
          <span v-for="(val, key) in obj">{{val}}-{{key}}</span>
        </div>
      `,
      data: {
        obj: { a: 0, b: 1, c: 2 }
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>0-a</span><span>1-b</span><span>2-c</span>')
    vm.obj.a = 3
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<span>3-a</span><span>1-b</span><span>2-c</span>')
      Vue.set(vm.obj, 'd', 4)
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>3-a</span><span>1-b</span><span>2-c</span><span>4-d</span>')
      Vue.delete(vm.obj, 'a')
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>1-b</span><span>2-c</span><span>4-d</span>')
    }).then(done)
  })

  it('should render an Object with key and index', done => {
    const vm = new Vue({
      template: `
        <div>
          <span v-for="(val, key, i) in obj">{{val}}-{{key}}-{{i}}</span>
        </div>
      `,
      data: {
        obj: { a: 0, b: 1, c: 2 }
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>0-a-0</span><span>1-b-1</span><span>2-c-2</span>')
    vm.obj.a = 3
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<span>3-a-0</span><span>1-b-1</span><span>2-c-2</span>')
      Vue.set(vm.obj, 'd', 4)
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>3-a-0</span><span>1-b-1</span><span>2-c-2</span><span>4-d-3</span>')
      Vue.delete(vm.obj, 'a')
    }).then(() => {
      expect(vm.$el.innerHTML).toBe('<span>1-b-0</span><span>2-c-1</span><span>4-d-2</span>')
    }).then(done)
  })

  it('should render each key of data', done => {
    const vm = new Vue({
      template: `
        <div>
          <span v-for="(val, key) in $data">{{val}}-{{key}}</span>
        </div>
      `,
      data: { a: 0, b: 1, c: 2 }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<span>0-a</span><span>1-b</span><span>2-c</span>')
    vm.a = 3
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toBe('<span>3-a</span><span>1-b</span><span>2-c</span>')
    }).then(done)
  })

  it('check priorities: v-if before v-for', function () {
    const vm = new Vue({
      data: {
        items: [1, 2, 3]
      },
      template: '<div><div v-if="item < 3" v-for="item in items">{{item}}</div></div>'
    }).$mount()
    expect(vm.$el.textContent).toBe('12')
  })

  it('check priorities: v-if after v-for', function () {
    const vm = new Vue({
      data: {
        items: [1, 2, 3]
      },
      template: '<div><div v-for="item in items" v-if="item < 3">{{item}}</div></div>'
    }).$mount()
    expect(vm.$el.textContent).toBe('12')
  })

  it('range v-for', () => {
    const vm = new Vue({
      template: '<div><div v-for="n in 3">{{n}}</div></div>'
    }).$mount()
    expect(vm.$el.textContent).toBe('123')
  })

  it('without key', done => {
    const vm = new Vue({
      data: {
        items: [
          { id: 1, msg: 'a' },
          { id: 2, msg: 'b' },
          { id: 3, msg: 'c' }
        ]
      },
      template: '<div><div v-for="item in items">{{ item.msg }}</div></div>'
    }).$mount()
    expect(vm.$el.textContent).toBe('abc')
    const first = vm.$el.children[0]
    vm.items.reverse()
    waitForUpdate(() => {
      expect(vm.$el.textContent).toBe('cba')
      // assert reusing DOM element in place
      expect(vm.$el.children[0]).toBe(first)
    }).then(done)
  })

  it('with key', done => {
    const vm = new Vue({
      data: {
        items: [
          { id: 1, msg: 'a' },
          { id: 2, msg: 'b' },
          { id: 3, msg: 'c' }
        ]
      },
      template: '<div><div v-for="item in items" :key="item.id">{{ item.msg }}</div></div>'
    }).$mount()
    expect(vm.$el.textContent).toBe('abc')
    const first = vm.$el.children[0]
    vm.items.reverse()
    waitForUpdate(() => {
      expect(vm.$el.textContent).toBe('cba')
      // assert moving DOM element
      expect(vm.$el.children[0]).not.toBe(first)
      expect(vm.$el.children[2]).toBe(first)
    }).then(done)
  })

  it('nested loops', () => {
    const vm = new Vue({
      data: {
        items: [
          { items: [{ a: 1 }, { a: 2 }], a: 1 },
          { items: [{ a: 3 }, { a: 4 }], a: 2 }
        ]
      },
      template:
        '<div>' +
          '<div v-for="(item, i) in items">' +
            '<p v-for="(subItem, j) in item.items">{{j}} {{subItem.a}} {{i}} {{item.a}}</p>' +
          '</div>' +
        '</div>'
    }).$mount()
    expect(vm.$el.innerHTML).toBe(
      '<div><p>0 1 0 1</p><p>1 2 0 1</p></div>' +
      '<div><p>0 3 1 2</p><p>1 4 1 2</p></div>'
    )
  })

  it('template v-for', done => {
    const vm = new Vue({
      data: {
        list: [
          { a: 1 },
          { a: 2 },
          { a: 3 }
        ]
      },
      template:
        '<div>' +
          '<template v-for="item in list">' +
            '<p>{{item.a}}</p>' +
            '<p>{{item.a + 1}}</p>' +
          '</template>' +
        '</div>'
    }).$mount()
    assertMarkup()
    vm.list.reverse()
    waitForUpdate(() => {
      assertMarkup()
      vm.list.splice(1, 1)
    }).then(() => {
      assertMarkup()
      vm.list.splice(1, 0, { a: 2 })
    }).then(done)

    function assertMarkup () {
      var markup = vm.list.map(function (item) {
        return '<p>' + item.a + '</p><p>' + (item.a + 1) + '</p>'
      }).join('')
      expect(vm.$el.innerHTML).toBe(markup)
    }
  })

  it('component v-for', done => {
    const vm = new Vue({
      data: {
        list: [
          { a: 1 },
          { a: 2 },
          { a: 3 }
        ]
      },
      template:
        '<div>' +
          '<test v-for="item in list" :msg="item.a" :key="item.a">' +
            '<span>{{item.a}}</span>' +
          '</test>' +
        '</div>',
      components: {
        test: {
          props: ['msg'],
          template: '<p>{{msg}}<slot></slot></p>'
        }
      }
    }).$mount()
    assertMarkup()
    vm.list.reverse()
    waitForUpdate(() => {
      assertMarkup()
      vm.list.splice(1, 1)
    }).then(() => {
      assertMarkup()
      vm.list.splice(1, 0, { a: 2 })
    }).then(done)

    function assertMarkup () {
      var markup = vm.list.map(function (item) {
        return `<p>${item.a}<span>${item.a}</span></p>`
      }).join('')
      expect(vm.$el.innerHTML).toBe(markup)
    }
  })

  it('dynamic component v-for', done => {
    const vm = new Vue({
      data: {
        list: [
          { type: 'one' },
          { type: 'two' }
        ]
      },
      template:
        '<div>' +
          '<component v-for="item in list" :key="item.type" :is="item.type"></component>' +
        '</div>',
      components: {
        one: {
          template: '<p>One!</p>'
        },
        two: {
          template: '<div>Two!</div>'
        }
      }
    }).$mount()
    expect(vm.$el.innerHTML).toContain('<p>One!</p><div>Two!</div>')
    vm.list.reverse()
    waitForUpdate(() => {
      expect(vm.$el.innerHTML).toContain('<div>Two!</div><p>One!</p>')
    }).then(done)
  })

  it('should warn component v-for without keys', () => {
    const warn = console.warn
    console.warn = jasmine.createSpy()
    new Vue({
      template: `<div><test v-for="i in 3"></test></div>`,
      components: {
        test: {
          render () {}
        }
      }
    }).$mount()
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      `<test v-for="i in 3">: component lists rendered with v-for should have explicit keys`
    )
    console.warn = warn
  })

  it('multi nested array reactivity', done => {
    const vm = new Vue({
      data: {
        list: [[['foo']]]
      },
      template: `
        <div>
          <div v-for="i in list">
            <div v-for="j in i">
              <div v-for="k in j">
                {{ k }}
              </div>
            </div>
          </div>
        </div>
      `
    }).$mount()
    expect(vm.$el.textContent).toMatch(/\s+foo\s+/)
    vm.list[0][0].push('bar')
    waitForUpdate(() => {
      expect(vm.$el.textContent).toMatch(/\s+foo\s+bar\s+/)
    }).then(done)
  })

  it('should work with strings', done => {
    const vm = new Vue({
      data: {
        text: 'foo'
      },
      template: `
        <div>
          <span v-for="letter in text">{{ letter }}.</span>
        </div>
      `
    }).$mount()
    expect(vm.$el.textContent).toMatch('f.o.o.')
    vm.text += 'bar'
    waitForUpdate(() => {
      expect(vm.$el.textContent).toMatch('f.o.o.b.a.r.')
    }).then(done)
  })

  const supportsDestructuring = (() => {
    try {
      new Function('var { foo } = bar')
      return true
    } catch (e) {}
  })()

  if (supportsDestructuring) {
    it('should support destructuring syntax in alias position (object)', () => {
      const vm = new Vue({
        data: { list: [{ foo: 'hi', bar: 'ho' }] },
        template: '<div><div v-for="({ foo, bar }, i) in list">{{ foo }} {{ bar }} {{ i }}</div></div>'
      }).$mount()
      expect(vm.$el.textContent).toBe('hi ho 0')
    })

    it('should support destructuring syntax in alias position (array)', () => {
      const vm = new Vue({
        data: { list: [[1, 2], [3, 4]] },
        template: '<div><div v-for="([ foo, bar ], i) in list">{{ foo }} {{ bar }} {{ i }}</div></div>'
      }).$mount()
      expect(vm.$el.textContent).toBe('1 2 03 4 1')
    })
  }
})
