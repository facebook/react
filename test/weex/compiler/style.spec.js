import { compile } from '../../../packages/weex-template-compiler'
import { strToRegExp } from '../helpers/index'

describe('compile style', () => {
  it('should be compiled', () => {
    const { render, staticRenderFns, errors } = compile(`<div style="a: x; b: y"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).not.toBeUndefined()
    expect(staticRenderFns.length).toEqual(0)
    expect(render).toMatch(strToRegExp(`staticStyle:{a:"x",b:"y"}`))
    expect(errors).toEqual([])
  })

  it('should compile empty style value', () => {
    const { render, staticRenderFns, errors } = compile(`<div style=""></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).not.toBeUndefined()
    expect(staticRenderFns.length).toEqual(0)
    expect(render).toMatch(/[(^style|^staticStyle)]/)
    expect(errors).toEqual([])
  })

  it('should compile style value with trailing semicolon', () => {
    const { render, staticRenderFns, errors } = compile(`<div style="a: x; b: y;"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).not.toBeUndefined()
    expect(staticRenderFns.length).toEqual(0)
    expect(render).toMatch(strToRegExp(`staticStyle:{a:"x",b:"y"}`))
    expect(errors).toEqual([])
  })

  it('should compile hyphenated style name & value', () => {
    const { render, staticRenderFns, errors } = compile(`<div style="-abc-def: x-y; abc-def: x-y"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).not.toBeUndefined()
    expect(staticRenderFns.length).toEqual(0)
    expect(render).toMatch(strToRegExp(`staticStyle:{AbcDef:"x-y",abcDef:"x-y"}`))
    expect(errors).toEqual([])
  })

  it('should compile dynamic style', () => {
    const { render, staticRenderFns, errors } = compile(`<div style="a: x; b: {{y}}"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).toEqual([])
    expect(render).toMatch(strToRegExp(`style:{a:"x",b:_s(y)}`))
    expect(errors).not.toBeUndefined()
    expect(errors.length).toEqual(1)
    expect(errors[0]).toMatch(strToRegExp(`b: {{y}}`))
    expect(errors[0]).toMatch(strToRegExp(`v-bind`))
  })

  it('should compile style binding of array', () => {
    const { render, staticRenderFns, errors } = compile(`<div v-bind:style="[a, b, c]"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).toEqual([])
    expect(render).toMatch(strToRegExp(`style:[a, b, c]`))
    expect(errors).toEqual([])
  })

  it('should compile style binding of map', () => {
    const { render, staticRenderFns, errors } = compile(`<div v-bind:style="{ a: x, b: 'y' + z }"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).toEqual([])
    expect(render).toMatch(strToRegExp(`style:{ a: x, b: 'y' + z }`))
    expect(errors).toEqual([])
  })

  it('should compile style binding of a variable', () => {
    const { render, staticRenderFns, errors } = compile(`<div v-bind:style="x"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).toEqual([])
    expect(render).toMatch(strToRegExp(`style:x`))
    expect(errors).toEqual([])
  })

  it('should compile style binding by shorthand', () => {
    const { render, staticRenderFns, errors } = compile(`<div :style="[a, b, c]"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).toEqual([])
    expect(render).toMatch(strToRegExp(`style:[a, b, c]`))
    expect(errors).toEqual([])
  })
})
