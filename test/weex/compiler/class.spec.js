import { compile } from '../../../packages/weex-template-compiler'
import { strToRegExp } from '../helpers/index'

describe('compile class', () => {
  it('should be compiled', () => {
    const { render, staticRenderFns, errors } = compile(`<div class="a b c"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).not.toBeUndefined()
    expect(staticRenderFns.length).toEqual(0)
    expect(render).toMatch(strToRegExp(`staticClass:["a","b","c"]`))
    expect(errors).toEqual([])
  })

  it('should compile dynamic class', () => {
    const { render, staticRenderFns, errors } = compile(`<div class="a {{b}} c"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).toEqual([])
    expect(render).toMatch(strToRegExp(`class:["a",_s(b),"c"]`))
    expect(errors).not.toBeUndefined()
    expect(errors.length).toEqual(1)
    expect(errors[0]).toMatch(strToRegExp(`a {{b}} c`))
    expect(errors[0]).toMatch(strToRegExp(`v-bind`))
  })

  it('should compile class binding of array', () => {
    const { render, staticRenderFns, errors } = compile(`<div v-bind:class="['a', 'b', c]"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).toEqual([])
    expect(render).toMatch(strToRegExp(`class:['a', 'b', c]`))
    expect(errors).toEqual([])
  })

  it('should compile class binding of map', () => {
    const { render, staticRenderFns, errors } = compile(`<div v-bind:class="{ a: true, b: x }"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).toEqual([])
    expect(render).toMatch(strToRegExp(`class:{ a: true, b: x }`))
    expect(errors).toEqual([])
  })

  it('should compile class binding of a variable', () => {
    const { render, staticRenderFns, errors } = compile(`<div v-bind:class="x"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).toEqual([])
    expect(render).toMatch(strToRegExp(`class:x`))
    expect(errors).toEqual([])
  })

  it('should compile class binding by shorthand', () => {
    const { render, staticRenderFns, errors } = compile(`<div :class="['a', 'b', c]"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).toEqual([])
    expect(render).toMatch(strToRegExp(`class:['a', 'b', c]`))
    expect(errors).toEqual([])
  })
})
