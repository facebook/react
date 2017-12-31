import { nextTick } from 'core/util/next-tick'

describe('nextTick', () => {
  it('accepts a callback', done => {
    nextTick(done)
  })

  it('returns undefined when passed a callback', () => {
    expect(nextTick(() => {})).toBeUndefined()
  })

  if (typeof Promise !== 'undefined') {
    it('returns a Promise when provided no callback', done => {
      nextTick().then(done)
    })

    it('returns a Promise with a context argument when provided a falsy callback and an object', done => {
      const obj = {}
      nextTick(undefined, obj).then(ctx => {
        expect(ctx).toBe(obj)
        done()
      })
    })

    it('returned Promise should resolve correctly vs callback', done => {
      const spy = jasmine.createSpy()
      nextTick(spy)
      nextTick().then(() => {
        expect(spy).toHaveBeenCalled()
        done()
      })
    })
  }
})
