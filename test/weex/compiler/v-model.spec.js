import { compile } from '../../../packages/weex-template-compiler'
import { strToRegExp } from '../helpers/index'

describe('compile v-model', () => {
  it('should compile modelable native component', () => {
    const { render, staticRenderFns, errors } = compile(`<div><input v-model="x" /></div>`)
    expect(render).not.toBeUndefined()
    expect(render).toMatch(strToRegExp(`attrs:{"value":(x)}`))
    expect(render).toMatch(strToRegExp(`on:{"input":function($event){x=$event.target.attr.value}}`))
    expect(staticRenderFns).toEqual([])
    expect(errors).toEqual([])
  })

  it('should compile other component with whole $event as the value', () => {
    const { render, staticRenderFns, errors } = compile(`<div><foo v-model="x" /></div>`)
    expect(render).not.toBeUndefined()
    expect(render).toMatch(strToRegExp(`model:{value:(x),callback:function ($$v) {x=$$v},expression:"x"}`))
    expect(staticRenderFns).toEqual([])
    expect(errors).toEqual([])
  })

  it('should compile with trim modifier for modelable native component', () => {
    const { render, staticRenderFns, errors } = compile(`<div><input v-model.trim="x" /></div>`)
    expect(render).not.toBeUndefined()
    expect(render).toMatch(strToRegExp(`attrs:{"value":(x)}`))
    expect(render).toMatch(strToRegExp(`on:{"input":function($event){x=$event.target.attr.value.trim()}}`))
    expect(staticRenderFns).toEqual([])
    expect(errors).toEqual([])
  })

  it('should compile with trim & lazy modifier', () => {
    const { render, staticRenderFns, errors } = compile(`<div><input v-model.trim.lazy="x" /><input v-model.lazy.trim="y" /></div>`)
    expect(render).not.toBeUndefined()
    expect(render).toMatch(strToRegExp(`attrs:{"value":(x)}`))
    expect(render).toMatch(strToRegExp(`attrs:{"value":(y)}`))
    expect(render).toMatch(strToRegExp(`on:{"change":function($event){x=$event.target.attr.value.trim()}}`))
    expect(render).toMatch(strToRegExp(`on:{"change":function($event){y=$event.target.attr.value.trim()}}`))
    expect(staticRenderFns).toEqual([])
    expect(errors).toEqual([])
  })
})
