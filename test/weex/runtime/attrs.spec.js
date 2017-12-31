import { getRoot, fireEvent, compileAndExecute } from '../helpers/index'

describe('generate attribute', () => {
  it('should be generated', (done) => {
    compileAndExecute(`
      <div>
        <text value="Hello World" style="font-size: 100"></text>
      </div>
    `).then(instance => {
      expect(getRoot(instance)).toEqual({
        type: 'div',
        children: [{
          type: 'text',
          style: { fontSize: '100' },
          attr: { value: 'Hello World' }
        }]
      })
      done()
    }).catch(e => done.fail(e))
  })

  it('should be updated', (done) => {
    compileAndExecute(`
      <div @click="foo">
        <text :value="x"></text>
      </div>
    `, `
      data: { x: 'Hello World' },
      methods: {
        foo: function () {
          this.x = 'Hello Vue'
        }
      }
    `).then(instance => {
      expect(getRoot(instance)).toEqual({
        type: 'div',
        event: ['click'],
        children: [
          { type: 'text', attr: { value: 'Hello World' }}
        ]
      })
      fireEvent(instance, '_root', 'click')
      return instance
    }).then(instance => {
      expect(getRoot(instance)).toEqual({
        type: 'div',
        event: ['click'],
        children: [
          { type: 'text', attr: { value: 'Hello Vue' }}
        ]
      })
      done()
    }).catch(e => done.fail(e))
  })

  it('should be cleared', (done) => {
    compileAndExecute(`
      <div @click="foo">
        <text :value="x"></text>
      </div>
    `, `
      data: { x: 'Hello World' },
      methods: {
        foo: function () {
          this.x = ''
        }
      }
    `).then(instance => {
      expect(getRoot(instance)).toEqual({
        type: 'div',
        event: ['click'],
        children: [
          { type: 'text', attr: { value: 'Hello World' }}
        ]
      })
      fireEvent(instance, '_root', 'click')
      return instance
    }).then(instance => {
      expect(getRoot(instance)).toEqual({
        type: 'div',
        event: ['click'],
        children: [
          { type: 'text', attr: { value: '' }}
        ]
      })
      done()
    })
  })
})
