import { getRoot, fireEvent, compileAndStringify, compileAndExecute } from '../helpers/index'

describe('generate events', () => {
  it('should be bound and fired for native component', (done) => {
    compileAndExecute(`
      <div @click="foo">
        <text>Hello {{x}}</text>
      </div>
    `, `
      data: { x: 'World' },
      methods: {
        foo: function () {
          this.x = 'Weex'
        }
      }
    `).then(instance => {
      expect(getRoot(instance)).toEqual({
        type: 'div',
        event: ['click'],
        children: [{
          type: 'text',
          attr: { value: 'Hello World' }
        }]
      })
      fireEvent(instance, '_root', 'click')
      return instance
    }).then(instance => {
      expect(getRoot(instance)).toEqual({
        type: 'div',
        event: ['click'],
        children: [{
          type: 'text',
          attr: { value: 'Hello Weex' }
        }]
      })
      done()
    })
  })

  it('should be bound and fired by custom component', (done) => {
    const { render, staticRenderFns } = compileAndStringify(`<text>Hello {{x}}</text>`)
    compileAndExecute(`
      <div>
        <text>Hello {{x}}</text>
        <sub @click="foo" @click.native="bar"></sub>
      </div>
    `, `
      data: { x: 'World' },
      components: {
        sub: {
          data: function () {
            return { x: 'Sub' }
          },
          render: ${render},
          staticRenderFns: ${staticRenderFns},
          created: function () {
            this.$emit('click')
          }
        }
      },
      methods: {
        foo: function () {
          this.x = 'Foo'
        },
        bar: function () {
          this.x = 'Bar'
        }
      }
    `).then(instance => {
      expect(getRoot(instance)).toEqual({
        type: 'div',
        children: [{
          type: 'text',
          attr: { value: 'Hello Foo' }
        }, {
          type: 'text',
          event: ['click'],
          attr: { value: 'Hello Sub' }
        }]
      })
      fireEvent(instance, instance.document.body.children[1].ref, 'click')
      return instance
    }).then(instance => {
      expect(getRoot(instance)).toEqual({
        type: 'div',
        children: [{
          type: 'text',
          attr: { value: 'Hello Bar' }
        }, {
          type: 'text',
          event: ['click'],
          attr: { value: 'Hello Sub' }
        }]
      })
      done()
    })
  })
})
