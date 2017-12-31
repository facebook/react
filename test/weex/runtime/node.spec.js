import {
  compileAndStringify,
  createInstance,
  getRoot,
  syncPromise,
  checkRefresh
} from '../helpers/index'

describe('node in render function', () => {
  it('should be generated', () => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      new Vue({
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: 'Hello' }}, [])
          ])
        },
        el: "body"
      })
    `)
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [
        { type: 'text', attr: { value: 'Hello' }}
      ]
    })
  })

  it('should be generated with all types of text', () => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      new Vue({
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: 'Hello' }}, []),
            'World',
            createElement('text', {}, ['Weex'])
          ])
        },
        el: "body"
      })
    `)
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [
        { type: 'text', attr: { value: 'Hello' }},
        { type: 'text', attr: { value: 'World' }},
        { type: 'text', attr: { value: 'Weex' }}
      ]
    })
  })

  it('should be generated with comments', () => {
    // todo
  })

  it('should be generated with module diff', (done) => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      new Vue({
        data: {
          counter: 0
        },
        methods: {
          foo: function () {}
        },
        render: function (createElement) {
          switch (this.counter) {
            case 1:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'World' }}, [])
            ])

            case 2:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'World' }, style: { fontSize: 100 }}, [])
            ])

            case 3:
            return createElement('div', {}, [
              createElement('text', {
                attrs: { value: 'World' },
                style: { fontSize: 100 },
                on: { click: this.foo }
              }, [])
            ])

            case 4:
            return createElement('div', {}, [
              createElement('text', {
                attrs: { value: 'Weex' },
                style: { color: '#ff0000' }
              }, [])
            ])

            default:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'Hello' }}, [])
            ])
          }
        },
        el: "body"
      })
    `)
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [
        { type: 'text', attr: { value: 'Hello' }}
      ]
    })

    syncPromise([
      checkRefresh(instance, { counter: 1 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'World' }}
          ]
        })
      }),
      checkRefresh(instance, { counter: 2 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'World' }, style: { fontSize: 100 }}
          ]
        })
      }),
      checkRefresh(instance, { counter: 3 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'World' }, style: { fontSize: 100 }, event: ['click'] }
          ]
        })
      }),
      checkRefresh(instance, { counter: 4 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'Weex' }, style: { fontSize: '', color: '#ff0000' }}
          ]
        })
        done()
      })
    ])
  })

  it('should be generated with sub components', () => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      new Vue({
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: 'Hello' }}, []),
            createElement('foo', { props: { x: 'Weex' }})
          ])
        },
        components: {
          foo: {
            props: {
              x: { default: 'World' }
            },
            render: function (createElement) {
              return createElement('text', { attrs: { value: this.x }}, [])
            }
          }
        },
        el: "body"
      })
    `)
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [
        { type: 'text', attr: { value: 'Hello' }},
        { type: 'text', attr: { value: 'Weex' }}
      ]
    })
  })

  it('should be generated with if/for diff', (done) => {
    const { render, staticRenderFns } = compileAndStringify(`
      <div>
        <text v-for="item in list" v-if="item.x">{{item.v}}</text>
      </div>
    `)
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      new Vue({
        data: {
          list: [
            { v: 'Hello', x: true },
            { v: 'World', x: false },
            { v: 'Weex', x: true }
          ]
        },
        computed: {
          x: {
            get: function () { return 0 },
            set: function (v) {
              switch (v) {
                case 1:
                this.list[1].x = true
                break
                case 2:
                this.list.push({ v: 'v-if' })
                break
                case 3:
                this.list.push({ v: 'v-for', x: true })
                break
                case 4:
                this.list.splice(1, 2)
                break
              }
            }
          }
        },
        render: ${render},
        staticRenderFns: ${staticRenderFns},
        el: "body"
      })
    `)
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [
        { type: 'text', attr: { value: 'Hello' }},
        { type: 'text', attr: { value: 'Weex' }}
      ]
    })

    syncPromise([
      checkRefresh(instance, { x: 1 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'Hello' }},
            { type: 'text', attr: { value: 'World' }},
            { type: 'text', attr: { value: 'Weex' }}
          ]
        })
      }),
      checkRefresh(instance, { x: 2 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'Hello' }},
            { type: 'text', attr: { value: 'World' }},
            { type: 'text', attr: { value: 'Weex' }}
          ]
        })
      }),
      checkRefresh(instance, { x: 3 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'Hello' }},
            { type: 'text', attr: { value: 'World' }},
            { type: 'text', attr: { value: 'Weex' }},
            { type: 'text', attr: { value: 'v-for' }}
          ]
        })
      }),
      checkRefresh(instance, { x: 4 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'Hello' }},
            { type: 'text', attr: { value: 'v-for' }}
          ]
        })
        done()
      })
    ])
  })

  it('should be generated with node structure diff', (done) => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      new Vue({
        data: {
          counter: 0
        },
        render: function (createElement) {
          switch (this.counter) {
            case 1:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'Hello' }}, []),
              createElement('text', { attrs: { value: 'World' }}, [])
            ])

            case 2:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'Hello' }}, []),
              createElement('text', { attrs: { value: 'World' }}, []),
              createElement('text', { attrs: { value: 'Weex' }}, [])
            ])

            case 3:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'Hello' }}, []),
              createElement('text', { attrs: { value: 'Weex' }}, [])
            ])

            case 4:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'Weex' }}, [])
            ])

            case 5:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'Hello' }}, []),
              createElement('text', { attrs: { value: 'Weex' }}, [])
            ])

            case 6:
            return createElement('div', {}, [
              createElement('input', { attrs: { value: 'Hello' }}, []),
              createElement('text', { attrs: { value: 'Weex' }}, [])
            ])

            default:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'Hello' }}, []),
            ])
          }
        },
        el: "body"
      })
    `)
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [
        { type: 'text', attr: { value: 'Hello' }}
      ]
    })

    syncPromise([
      checkRefresh(instance, { counter: 1 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'Hello' }},
            { type: 'text', attr: { value: 'World' }}
          ]
        })
      }),
      checkRefresh(instance, { counter: 2 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'Hello' }},
            { type: 'text', attr: { value: 'World' }},
            { type: 'text', attr: { value: 'Weex' }}
          ]
        })
      }),
      checkRefresh(instance, { counter: 3 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'Hello' }},
            { type: 'text', attr: { value: 'Weex' }}
          ]
        })
      }),
      checkRefresh(instance, { counter: 4 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'Weex' }}
          ]
        })
      }),
      checkRefresh(instance, { counter: 5 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'Hello' }},
            { type: 'text', attr: { value: 'Weex' }}
          ]
        })
      }),
      checkRefresh(instance, { counter: 6 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'input', attr: { value: 'Hello' }},
            { type: 'text', attr: { value: 'Weex' }}
          ]
        })
        done()
      })
    ])
  })

  it('should be generated with component diff', (done) => {
    const id = String(Date.now() * Math.random())
    const instance = createInstance(id, `
      new Vue({
        data: {
          counter: 0
        },
        components: {
          foo: {
            props: { a: { default: '1' }, b: { default: '2' }},
            render: function (createElement) {
              return createElement('text', { attrs: { value: this.a + '-' + this.b }}, [])
            }
          },
          bar: {
            render: function (createElement) {
              return createElement('text', { attrs: { value: 'Bar' }, style: { fontSize: 100 }})
            }
          },
          baz: {
            render: function (createElement) {
              return createElement('image', { attrs: { src: 'http://example.com/favicon.ico' }})
            }
          }
        },
        render: function (createElement) {
          switch (this.counter) {
            case 1:
            return createElement('div', {}, [
              createElement('foo', { props: { a: '111', b: '222' }}, [])
            ])

            case 2:
            return createElement('div', {}, [
              createElement('foo', {}, [])
            ])

            case 3:
            return createElement('div', {}, [
              createElement('bar', {}, [])
            ])

            case 4:
            return createElement('div', {}, [
              createElement('baz', {}, [])
            ])

            case 5:
            return createElement('div', {}, [
              createElement('foo', {}, []),
              createElement('bar', {}, []),
              createElement('baz', {}, [])
            ])

            default:
            return createElement('div', {}, [
              createElement('foo', { props: { a: '111' }}, [])
            ])
          }
        },
        el: "body"
      })
    `)
    expect(getRoot(instance)).toEqual({
      type: 'div',
      children: [
        { type: 'text', attr: { value: '111-2' }}
      ]
    })

    syncPromise([
      checkRefresh(instance, { counter: 1 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: '111-222' }}
          ]
        })
      }),
      checkRefresh(instance, { counter: 2 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: '1-2' }}
          ]
        })
      }),
      checkRefresh(instance, { counter: 3 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'Bar' }, style: { fontSize: 100 }}
          ]
        })
      }),
      checkRefresh(instance, { counter: 4 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'image', attr: { src: 'http://example.com/favicon.ico' }}
          ]
        })
      }),
      checkRefresh(instance, { counter: 5 }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: '1-2' }},
            { type: 'text', attr: { value: 'Bar' }, style: { fontSize: 100 }},
            { type: 'image', attr: { src: 'http://example.com/favicon.ico' }}
          ]
        })
        done()
      })
    ])
  })
})
