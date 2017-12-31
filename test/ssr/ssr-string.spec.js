import Vue from '../../dist/vue.runtime.common.js'
import VM from 'vm'
import { createRenderer } from '../../packages/vue-server-renderer'
const { renderToString } = createRenderer()

describe('SSR: renderToString', () => {
  it('static attributes', done => {
    renderVmWithOptions({
      template: '<div id="foo" bar="123"></div>'
    }, result => {
      expect(result).toContain('<div id="foo" bar="123" data-server-rendered="true"></div>')
      done()
    })
  })

  it('unary tags', done => {
    renderVmWithOptions({
      template: '<input value="123">'
    }, result => {
      expect(result).toContain('<input value="123" data-server-rendered="true">')
      done()
    })
  })

  it('dynamic attributes', done => {
    renderVmWithOptions({
      template: '<div qux="quux" :id="foo" :bar="baz"></div>',
      data: {
        foo: 'hi',
        baz: 123
      }
    }, result => {
      expect(result).toContain('<div qux="quux" id="hi" bar="123" data-server-rendered="true"></div>')
      done()
    })
  })

  it('static class', done => {
    renderVmWithOptions({
      template: '<div class="foo bar"></div>'
    }, result => {
      expect(result).toContain('<div data-server-rendered="true" class="foo bar"></div>')
      done()
    })
  })

  it('dynamic class', done => {
    renderVmWithOptions({
      template: '<div class="foo bar" :class="[a, { qux: hasQux, quux: hasQuux }]"></div>',
      data: {
        a: 'baz',
        hasQux: true,
        hasQuux: false
      }
    }, result => {
      expect(result).toContain('<div data-server-rendered="true" class="foo bar baz qux"></div>')
      done()
    })
  })

  it('custom component class', done => {
    renderVmWithOptions({
      template: '<div><cmp class="cmp"></cmp></div>',
      components: {
        cmp: {
          render: h => h('div', 'test')
        }
      }
    }, result => {
      expect(result).toContain('<div data-server-rendered="true"><div class="cmp">test</div></div>')
      done()
    })
  })

  it('nested component class', done => {
    renderVmWithOptions({
      template: '<cmp class="outer" :class="cls"></cmp>',
      data: { cls: { 'success': 1 }},
      components: {
        cmp: {
          render: h => h('div', [h('nested', { staticClass: 'nested', 'class': { 'error': 1 }})]),
          components: {
            nested: {
              render: h => h('div', { staticClass: 'inner' }, 'test')
            }
          }
        }
      }
    }, result => {
      expect(result).toContain('<div data-server-rendered="true" class="outer success">' +
          '<div class="inner nested error">test</div>' +
        '</div>')
      done()
    })
  })

  it('dynamic style', done => {
    renderVmWithOptions({
      template: '<div style="background-color:black" :style="{ fontSize: fontSize + \'px\', color: color }"></div>',
      data: {
        fontSize: 14,
        color: 'red'
      }
    }, result => {
      expect(result).toContain(
        '<div data-server-rendered="true" style="background-color:black;font-size:14px;color:red;"></div>'
      )
      done()
    })
  })

  it('dynamic string style', done => {
    renderVmWithOptions({
      template: '<div :style="style"></div>',
      data: {
        style: 'color:red'
      }
    }, result => {
      expect(result).toContain(
        '<div data-server-rendered="true" style="color:red;"></div>'
      )
      done()
    })
  })

  it('auto-prefixed style value as array', done => {
    renderVmWithOptions({
      template: '<div :style="style"></div>',
      data: {
        style: {
          display: ['-webkit-box', '-ms-flexbox', 'flex']
        }
      }
    }, result => {
      expect(result).toContain(
        '<div data-server-rendered="true" style="display:-webkit-box;display:-ms-flexbox;display:flex;"></div>'
      )
      done()
    })
  })

  it('custom component style', done => {
    renderVmWithOptions({
      template: '<section><comp :style="style"></comp></section>',
      data: {
        style: 'color:red'
      },
      components: {
        comp: {
          template: '<div></div>'
        }
      }
    }, result => {
      expect(result).toContain(
        '<section data-server-rendered="true"><div style="color:red;"></div></section>'
      )
      done()
    })
  })

  it('nested custom component style', done => {
    renderVmWithOptions({
      template: '<comp style="color: blue" :style="style"></comp>',
      data: {
        style: 'color:red'
      },
      components: {
        comp: {
          template: '<nested style="text-align: left;" :style="{fontSize:\'520rem\'}"></nested>',
          components: {
            nested: {
              template: '<div></div>'
            }
          }
        }
      }
    }, result => {
      expect(result).toContain(
        '<div data-server-rendered="true" style="text-align:left;font-size:520rem;color:red;"></div>'
      )
      done()
    })
  })

  it('component style not passed to child', done => {
    renderVmWithOptions({
      template: '<comp :style="style"></comp>',
      data: {
        style: 'color:red'
      },
      components: {
        comp: {
          template: '<div><div></div></div>'
        }
      }
    }, result => {
      expect(result).toContain(
        '<div data-server-rendered="true" style="color:red;"><div></div></div>'
      )
      done()
    })
  })

  it('component style not passed to slot', done => {
    renderVmWithOptions({
      template: '<comp :style="style"><span style="color:black"></span></comp>',
      data: {
        style: 'color:red'
      },
      components: {
        comp: {
          template: '<div><slot></slot></div>'
        }
      }
    }, result => {
      expect(result).toContain(
        '<div data-server-rendered="true" style="color:red;"><span style="color:black;"></span></div>'
      )
      done()
    })
  })

  it('attrs merging on components', done => {
    const Test = {
      render: h => h('div', {
        attrs: { id: 'a' }
      })
    }
    renderVmWithOptions({
      render: h => h(Test, {
        attrs: { id: 'b', name: 'c' }
      })
    }, res => {
      expect(res).toContain(
        '<div id="b" data-server-rendered="true" name="c"></div>'
      )
      done()
    })
  })

  it('domProps merging on components', done => {
    const Test = {
      render: h => h('div', {
        domProps: { innerHTML: 'a' }
      })
    }
    renderVmWithOptions({
      render: h => h(Test, {
        domProps: { innerHTML: 'b', value: 'c' }
      })
    }, res => {
      expect(res).toContain(
        '<div data-server-rendered="true" value="c">b</div>'
      )
      done()
    })
  })

  it('v-show directive render', done => {
    renderVmWithOptions({
      template: '<div v-show="false"><span>inner</span></div>'
    }, res => {
      expect(res).toContain(
        '<div data-server-rendered="true" style="display:none;"><span>inner</span></div>'
      )
      done()
    })
  })

  it('v-show directive not passed to child', done => {
    renderVmWithOptions({
      template: '<foo v-show="false"></foo>',
      components: {
        foo: {
          template: '<div><span>inner</span></div>'
        }
      }
    }, res => {
      expect(res).toContain(
        '<div data-server-rendered="true" style="display:none;"><span>inner</span></div>'
      )
      done()
    })
  })

  it('v-show directive not passed to slot', done => {
    renderVmWithOptions({
      template: '<foo v-show="false"><span>inner</span></foo>',
      components: {
        foo: {
          template: '<div><slot></slot></div>'
        }
      }
    }, res => {
      expect(res).toContain(
        '<div data-server-rendered="true" style="display:none;"><span>inner</span></div>'
      )
      done()
    })
  })

  it('v-show directive merging on components', done => {
    renderVmWithOptions({
      template: '<foo v-show="false"></foo>',
      components: {
        foo: {
          render: h => h('bar', {
            directives: [{
              name: 'show',
              value: true
            }]
          }),
          components: {
            bar: {
              render: h => h('div', 'inner')
            }
          }
        }
      }
    }, res => {
      expect(res).toContain(
        '<div data-server-rendered="true" style="display:none;">inner</div>'
      )
      done()
    })
  })

  it('text interpolation', done => {
    renderVmWithOptions({
      template: '<div>{{ foo }} side {{ bar }}</div>',
      data: {
        foo: 'server',
        bar: '<span>rendering</span>'
      }
    }, result => {
      expect(result).toContain('<div data-server-rendered="true">server side &lt;span&gt;rendering&lt;/span&gt;</div>')
      done()
    })
  })

  it('v-html on root', done => {
    renderVmWithOptions({
      template: '<div v-html="text"></div>',
      data: {
        text: '<span>foo</span>'
      }
    }, result => {
      expect(result).toContain('<div data-server-rendered="true"><span>foo</span></div>')
      done()
    })
  })

  it('v-text on root', done => {
    renderVmWithOptions({
      template: '<div v-text="text"></div>',
      data: {
        text: '<span>foo</span>'
      }
    }, result => {
      expect(result).toContain('<div data-server-rendered="true">&lt;span&gt;foo&lt;/span&gt;</div>')
      done()
    })
  })

  it('v-html', done => {
    renderVmWithOptions({
      template: '<div><div v-html="text"></div></div>',
      data: {
        text: '<span>foo</span>'
      }
    }, result => {
      expect(result).toContain('<div data-server-rendered="true"><div><span>foo</span></div></div>')
      done()
    })
  })

  it('v-html with null value', done => {
    renderVmWithOptions({
      template: '<div><div v-html="text"></div></div>',
      data: {
        text: null
      }
    }, result => {
      expect(result).toContain('<div data-server-rendered="true"><div></div></div>')
      done()
    })
  })

  it('v-text', done => {
    renderVmWithOptions({
      template: '<div><div v-text="text"></div></div>',
      data: {
        text: '<span>foo</span>'
      }
    }, result => {
      expect(result).toContain('<div data-server-rendered="true"><div>&lt;span&gt;foo&lt;/span&gt;</div></div>')
      done()
    })
  })

  it('v-text with null value', done => {
    renderVmWithOptions({
      template: '<div><div v-text="text"></div></div>',
      data: {
        text: null
      }
    }, result => {
      expect(result).toContain('<div data-server-rendered="true"><div></div></div>')
      done()
    })
  })

  it('child component (hoc)', done => {
    renderVmWithOptions({
      template: '<child class="foo" :msg="msg"></child>',
      data: {
        msg: 'hello'
      },
      components: {
        child: {
          props: ['msg'],
          data () {
            return { name: 'bar' }
          },
          render () {
            const h = this.$createElement
            return h('div', { class: ['bar'] }, [`${this.msg} ${this.name}`])
          }
        }
      }
    }, result => {
      expect(result).toContain('<div data-server-rendered="true" class="foo bar">hello bar</div>')
      done()
    })
  })

  it('has correct lifecycle during render', done => {
    let lifecycleCount = 1
    renderVmWithOptions({
      template: '<div><span>{{ val }}</span><test></test></div>',
      data: {
        val: 'hi'
      },
      beforeCreate () {
        expect(lifecycleCount++).toBe(1)
      },
      created () {
        this.val = 'hello'
        expect(this.val).toBe('hello')
        expect(lifecycleCount++).toBe(2)
      },
      components: {
        test: {
          beforeCreate () {
            expect(lifecycleCount++).toBe(3)
          },
          created () {
            expect(lifecycleCount++).toBe(4)
          },
          render () {
            expect(lifecycleCount++).toBeGreaterThan(4)
            return this.$createElement('span', { class: ['b'] }, 'testAsync')
          }
        }
      }
    }, result => {
      expect(result).toContain(
        '<div data-server-rendered="true">' +
          '<span>hello</span>' +
          '<span class="b">testAsync</span>' +
        '</div>'
      )
      done()
    })
  })

  it('computed properties', done => {
    renderVmWithOptions({
      template: '<div>{{ b }}</div>',
      data: {
        a: {
          b: 1
        }
      },
      computed: {
        b () {
          return this.a.b + 1
        }
      },
      created () {
        this.a.b = 2
        expect(this.b).toBe(3)
      }
    }, result => {
      expect(result).toContain('<div data-server-rendered="true">3</div>')
      done()
    })
  })

  it('renders async component', done => {
    renderVmWithOptions({
      template: `
        <div>
          <test-async></test-async>
        </div>
      `,
      components: {
        testAsync (resolve) {
          setTimeout(() => resolve({
            render () {
              return this.$createElement('span', { class: ['b'] }, 'testAsync')
            }
          }), 1)
        }
      }
    }, result => {
      expect(result).toContain('<div data-server-rendered="true"><span class="b">testAsync</span></div>')
      done()
    })
  })

  it('renders async component (Promise, nested)', done => {
    const Foo = () => Promise.resolve({
      render: h => h('div', [h('span', 'foo'), h(Bar)])
    })
    const Bar = () => ({
      component: Promise.resolve({
        render: h => h('span', 'bar')
      })
    })
    renderVmWithOptions({
      render: h => h(Foo)
    }, res => {
      expect(res).toContain(`<div data-server-rendered="true"><span>foo</span><span>bar</span></div>`)
      done()
    })
  })

  it('renders async component (ES module)', done => {
    const Foo = () => Promise.resolve({
      __esModule: true,
      default: {
        render: h => h('div', [h('span', 'foo'), h(Bar)])
      }
    })
    const Bar = () => ({
      component: Promise.resolve({
        __esModule: true,
        default: {
          render: h => h('span', 'bar')
        }
      })
    })
    renderVmWithOptions({
      render: h => h(Foo)
    }, res => {
      expect(res).toContain(`<div data-server-rendered="true"><span>foo</span><span>bar</span></div>`)
      done()
    })
  })

  it('renders async component (hoc)', done => {
    renderVmWithOptions({
      template: '<test-async></test-async>',
      components: {
        testAsync: () => Promise.resolve({
          render () {
            return this.$createElement('span', { class: ['b'] }, 'testAsync')
          }
        })
      }
    }, result => {
      expect(result).toContain('<span data-server-rendered="true" class="b">testAsync</span>')
      done()
    })
  })

  it('should catch async component error', done => {
    Vue.config.silent = true
    renderToString(new Vue({
      template: '<test-async></test-async>',
      components: {
        testAsync: () => Promise.resolve({
          render () {
            throw new Error('foo')
          }
        })
      }
    }), (err, result) => {
      Vue.config.silent = false
      expect(err).toBeTruthy()
      expect(result).toBeUndefined()
      done()
    })
  })

  it('everything together', done => {
    renderVmWithOptions({
      template: `
        <div>
          <p class="hi">yoyo</p>
          <div id="ho" :class="{ red: isRed }"></div>
          <span>{{ test }}</span>
          <input :value="test">
          <img :src="imageUrl">
          <test></test>
          <test-async></test-async>
        </div>
      `,
      data: {
        test: 'hi',
        isRed: true,
        imageUrl: 'https://vuejs.org/images/logo.png'
      },
      components: {
        test: {
          render () {
            return this.$createElement('div', { class: ['a'] }, 'test')
          }
        },
        testAsync (resolve) {
          resolve({
            render () {
              return this.$createElement('span', { class: ['b'] }, 'testAsync')
            }
          })
        }
      }
    }, result => {
      expect(result).toContain(
        '<div data-server-rendered="true">' +
          '<p class="hi">yoyo</p> ' +
          '<div id="ho" class="red"></div> ' +
          '<span>hi</span> ' +
          '<input value="hi"> ' +
          '<img src="https://vuejs.org/images/logo.png"> ' +
          '<div class="a">test</div> ' +
          '<span class="b">testAsync</span>' +
        '</div>'
      )
      done()
    })
  })

  it('normal attr', done => {
    renderVmWithOptions({
      template: `
        <div>
          <span :test="'ok'">hello</span>
          <span :test="null">hello</span>
          <span :test="false">hello</span>
          <span :test="true">hello</span>
          <span :test="0">hello</span>
        </div>
      `
    }, result => {
      expect(result).toContain(
        '<div data-server-rendered="true">' +
          '<span test="ok">hello</span> ' +
          '<span>hello</span> ' +
          '<span>hello</span> ' +
          '<span test="true">hello</span> ' +
          '<span test="0">hello</span>' +
        '</div>'
      )
      done()
    })
  })

  it('enumerated attr', done => {
    renderVmWithOptions({
      template: `
        <div>
          <span :draggable="true">hello</span>
          <span :draggable="'ok'">hello</span>
          <span :draggable="null">hello</span>
          <span :draggable="false">hello</span>
          <span :draggable="''">hello</span>
          <span :draggable="'false'">hello</span>
        </div>
      `
    }, result => {
      expect(result).toContain(
        '<div data-server-rendered="true">' +
          '<span draggable="true">hello</span> ' +
          '<span draggable="true">hello</span> ' +
          '<span draggable="false">hello</span> ' +
          '<span draggable="false">hello</span> ' +
          '<span draggable="true">hello</span> ' +
          '<span draggable="false">hello</span>' +
        '</div>'
      )
      done()
    })
  })

  it('boolean attr', done => {
    renderVmWithOptions({
      template: `
        <div>
          <span :disabled="true">hello</span>
          <span :disabled="'ok'">hello</span>
          <span :disabled="null">hello</span>
          <span :disabled="''">hello</span>
        </div>
      `
    }, result => {
      expect(result).toContain(
        '<div data-server-rendered="true">' +
          '<span disabled="disabled">hello</span> ' +
          '<span disabled="disabled">hello</span> ' +
          '<span>hello</span> ' +
          '<span disabled="disabled">hello</span>' +
        '</div>'
      )
      done()
    })
  })

  it('v-bind object', done => {
    renderVmWithOptions({
      data: {
        test: { id: 'a', class: ['a', 'b'], value: 'c' }
      },
      template: '<input v-bind="test">'
    }, result => {
      expect(result).toContain('<input id="a" data-server-rendered="true" value="c" class="a b">')
      done()
    })
  })

  it('custom directives', done => {
    const renderer = createRenderer({
      directives: {
        'class-prefixer': (node, dir) => {
          if (node.data.class) {
            node.data.class = `${dir.value}-${node.data.class}`
          }
          if (node.data.staticClass) {
            node.data.staticClass = `${dir.value}-${node.data.staticClass}`
          }
        }
      }
    })
    renderer.renderToString(new Vue({
      render () {
        const h = this.$createElement
        return h('p', {
          class: 'class1',
          staticClass: 'class2',
          directives: [{
            name: 'class-prefixer',
            value: 'my'
          }]
        }, ['hello world'])
      }
    }), (err, result) => {
      expect(err).toBeNull()
      expect(result).toContain('<p data-server-rendered="true" class="my-class2 my-class1">hello world</p>')
      done()
    })
  })

  it('_scopeId', done => {
    renderVmWithOptions({
      _scopeId: '_v-parent',
      template: '<div id="foo"><p><child></child></p></div>',
      components: {
        child: {
          _scopeId: '_v-child',
          render () {
            const h = this.$createElement
            return h('div', null, [h('span', null, ['foo'])])
          }
        }
      }
    }, result => {
      expect(result).toContain(
        '<div id="foo" data-server-rendered="true" _v-parent>' +
          '<p _v-parent>' +
            '<div _v-child _v-parent><span _v-child>foo</span></div>' +
          '</p>' +
        '</div>'
      )
      done()
    })
  })

  it('_scopeId on slot content', done => {
    renderVmWithOptions({
      _scopeId: '_v-parent',
      template: '<div><child><p>foo</p></child></div>',
      components: {
        child: {
          _scopeId: '_v-child',
          render () {
            const h = this.$createElement
            return h('div', null, this.$slots.default)
          }
        }
      }
    }, result => {
      expect(result).toContain(
        '<div data-server-rendered="true" _v-parent>' +
          '<div _v-child _v-parent><p _v-child _v-parent>foo</p></div>' +
        '</div>'
      )
      done()
    })
  })

  it('comment nodes', done => {
    renderVmWithOptions({
      template: '<div><transition><div v-if="false"></div></transition></div>'
    }, result => {
      expect(result).toContain(`<div data-server-rendered="true"><!----></div>`)
      done()
    })
  })

  it('should catch error', done => {
    Vue.config.silent = true
    renderToString(new Vue({
      render () {
        throw new Error('oops')
      }
    }), err => {
      expect(err instanceof Error).toBe(true)
      Vue.config.silent = false
      done()
    })
  })

  it('default value Foreign Function', () => {
    const FunctionConstructor = VM.runInNewContext('Function')
    const func = () => 123
    const vm = new Vue({
      props: {
        a: {
          type: FunctionConstructor,
          default: func
        }
      },
      propsData: {
        a: undefined
      }
    })
    expect(vm.a).toBe(func)
  })

  it('should prevent xss in attributes', done => {
    renderVmWithOptions({
      data: {
        xss: '"><script>alert(1)</script>'
      },
      template: `
        <div>
          <a :title="xss" :style="{ color: xss }" :class="[xss]">foo</a>
        </div>
      `
    }, res => {
      expect(res).not.toContain(`<script>alert(1)</script>`)
      done()
    })
  })

  it('should prevent script xss with v-bind object syntax + array value', done => {
    renderVmWithOptions({
      data: {
        test: ['"><script>alert(1)</script><!--"']
      },
      template: `<div v-bind="{ test }"></div>`
    }, res => {
      expect(res).not.toContain(`<script>alert(1)</script>`)
      done()
    })
  })

  it('v-if', done => {
    renderVmWithOptions({
      template: `
        <div>
          <span v-if="true">foo</span>
          <span v-if="false">bar</span>
        </div>
      `
    }, res => {
      expect(res).toContain(`<div data-server-rendered="true"><span>foo</span> <!----></div>`)
      done()
    })
  })

  it('v-for', done => {
    renderVmWithOptions({
      template: `
        <div>
          <span>foo</span>
          <span v-for="i in 2">{{ i }}</span>
        </div>
      `
    }, res => {
      expect(res).toContain(`<div data-server-rendered="true"><span>foo</span> <span>1</span><span>2</span></div>`)
      done()
    })
  })

  it('template v-if', done => {
    renderVmWithOptions({
      template: `
        <div>
          <span>foo</span>
          <template v-if="true">
            <span>foo</span> bar <span>baz</span>
          </template>
        </div>
      `
    }, res => {
      expect(res).toContain(`<div data-server-rendered="true"><span>foo</span> <span>foo</span> bar <span>baz</span></div>`)
      done()
    })
  })

  it('template v-for', done => {
    renderVmWithOptions({
      template: `
        <div>
          <span>foo</span>
          <template v-for="i in 2">
            <span>{{ i }}</span><span>bar</span>
          </template>
        </div>
      `
    }, res => {
      expect(res).toContain(`<div data-server-rendered="true"><span>foo</span> <span>1</span><span>bar</span><span>2</span><span>bar</span></div>`)
      done()
    })
  })

  it('with inheritAttrs: false + $attrs', done => {
    renderVmWithOptions({
      template: `<foo id="a"/>`,
      components: {
        foo: {
          inheritAttrs: false,
          template: `<div><div v-bind="$attrs"></div></div>`
        }
      }
    }, res => {
      expect(res).toBe(`<div data-server-rendered="true"><div id="a"></div></div>`)
      done()
    })
  })

  it('should escape static strings', done => {
    renderVmWithOptions({
      template: `<div>&lt;foo&gt;</div>`
    }, res => {
      expect(res).toBe(`<div data-server-rendered="true">&lt;foo&gt;</div>`)
      done()
    })
  })

  it('should not cache computed properties', done => {
    renderVmWithOptions({
      template: `<div>{{ foo }}</div>`,
      data: () => ({ bar: 1 }),
      computed: {
        foo () { return this.bar + 1 }
      },
      created () {
        this.foo // access
        this.bar++ // trigger change
      }
    }, res => {
      expect(res).toBe(`<div data-server-rendered="true">3</div>`)
      done()
    })
  })

  it('return Promise', done => {
    renderToString(new Vue({
      template: `<div>{{ foo }}</div>`,
      data: { foo: 'bar' }
    })).then(res => {
      expect(res).toBe(`<div data-server-rendered="true">bar</div>`)
      done()
    })
  })

  it('return Promise (error)', done => {
    Vue.config.silent = true
    renderToString(new Vue({
      render () {
        throw new Error('foobar')
      }
    })).catch(err => {
      expect(err.toString()).toContain(`foobar`)
      Vue.config.silent = false
      done()
    })
  })

  it('should catch template compilation error', done => {
    renderToString(new Vue({
      template: `<div></div><div></div>`
    }), (err, res) => {
      expect(err.toString()).toContain('Component template should contain exactly one root element')
      done()
    })
  })

  // #6907
  it('should not optimize root if conditions', done => {
    renderVmWithOptions({
      data: { foo: 123 },
      template: `<input :type="'text'" v-model="foo">`
    }, res => {
      expect(res).toBe(`<input type="text" data-server-rendered="true" value="123">`)
      done()
    })
  })

  it('render muted properly', done => {
    renderVmWithOptions({
      template: '<video muted></video>'
    }, result => {
      expect(result).toContain('<video muted="muted" data-server-rendered="true"></video>')
      done()
    })
  })

  it('render v-model with textarea', done => {
    renderVmWithOptions({
      data: { foo: 'bar' },
      template: '<div><textarea v-model="foo"></textarea></div>'
    }, result => {
      expect(result).toContain('<textarea>bar</textarea>')
      done()
    })
  })

  it('render v-model with textarea (non-optimized)', done => {
    renderVmWithOptions({
      render (h) {
        return h('textarea', {
          domProps: {
            value: 'foo'
          }
        })
      }
    }, result => {
      expect(result).toContain('<textarea data-server-rendered="true">foo</textarea>')
      done()
    })
  })

  it('render v-model with <select> (value binding)', done => {
    renderVmWithOptions({
      data: {
        selected: 2,
        options: [
          { id: 1, label: 'one' },
          { id: 2, label: 'two' }
        ]
      },
      template: `
      <div>
        <select v-model="selected">
          <option v-for="o in options" :value="o.id">{{ o.label }}</option>
        </select>
      </div>
      `
    }, result => {
      expect(result).toContain(
        '<select>' +
          '<option value="1">one</option>' +
          '<option selected="selected" value="2">two</option>' +
        '</select>'
      )
      done()
    })
  })

  it('render v-model with <select> (static value)', done => {
    renderVmWithOptions({
      data: {
        selected: 2
      },
      template: `
      <div>
        <select v-model="selected">
          <option value="1">one</option>
          <option value="2">two</option>
        </select>
      </div>
      `
    }, result => {
      expect(result).toContain(
        '<select>' +
          '<option value="1">one</option> ' +
          '<option value="2" selected="selected">two</option>' +
        '</select>'
      )
      done()
    })
  })

  it('render v-model with <select> (text as value)', done => {
    renderVmWithOptions({
      data: {
        selected: 2,
        options: [
          { id: 1, label: 'one' },
          { id: 2, label: 'two' }
        ]
      },
      template: `
      <div>
        <select v-model="selected">
          <option v-for="o in options">{{ o.id }}</option>
        </select>
      </div>
      `
    }, result => {
      expect(result).toContain(
        '<select>' +
          '<option>1</option>' +
          '<option selected="selected">2</option>' +
        '</select>'
      )
      done()
    })
  })

  // #7223
  it('should not double escape attribute values', done => {
    renderVmWithOptions({
      template: `
      <div>
        <div id="a\nb"></div>
      </div>
      `
    }, result => {
      expect(result).toContain(`<div id="a\nb"></div>`)
      done()
    })
  })
})

function renderVmWithOptions (options, cb) {
  renderToString(new Vue(options), (err, res) => {
    expect(err).toBeNull()
    cb(res)
  })
}
