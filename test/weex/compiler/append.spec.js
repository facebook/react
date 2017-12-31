import { compile } from '../../../packages/weex-template-compiler'
import { strToRegExp } from '../helpers/index'

describe('append props', () => {
  it('add append="tree" on <cell>', () => {
    const { render, staticRenderFns, errors } = compile(`<list><cell></cell></list>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).not.toBeUndefined()
    expect(staticRenderFns.length).toEqual(1)
    expect(staticRenderFns).toMatch(strToRegExp(`appendAsTree:true`))
    expect(staticRenderFns).toMatch(strToRegExp(`attrs:{"append":"tree"}`))
    expect(errors).toEqual([])
  })

  it('override append="node" on <cell>', () => {
    const { render, staticRenderFns, errors } = compile(`<list><cell append="node"></cell></list>`)
    expect(render + staticRenderFns).toMatch(strToRegExp(`attrs:{"append":"node"}`))
    expect(errors).toEqual([])
  })

  it('add append="tree" on <header>', () => {
    const { render, staticRenderFns, errors } = compile(`<list><header></header></list>`)
    expect(render + staticRenderFns).toMatch(strToRegExp(`appendAsTree:true`))
    expect(render + staticRenderFns).toMatch(strToRegExp(`attrs:{"append":"tree"}`))
    expect(errors).toEqual([])
  })

  it('add append="tree" on <recycle-list>', () => {
    const { render, staticRenderFns, errors } = compile(`<recycle-list for="item in list"><div></div></recycle-list>`)
    expect(render + staticRenderFns).toMatch(strToRegExp(`appendAsTree:true`))
    expect(render + staticRenderFns).toMatch(strToRegExp(`attrs:{"listData":list,"alias":"item","append":"tree"}`))
    expect(errors).toEqual([])
  })

  it('add append="tree" on <cell-slot>', () => {
    const { render, staticRenderFns, errors } = compile(`<list><cell-slot></cell-slot></list>`)
    expect(render + staticRenderFns).toMatch(strToRegExp(`appendAsTree:true`))
    expect(render + staticRenderFns).toMatch(strToRegExp(`attrs:{"append":"tree"}`))
    expect(errors).toEqual([])
  })

  it('override append="node" on <cell-slot>', () => {
    const { render, staticRenderFns, errors } = compile(`<list><cell-slot append="node"></cell-slot></list>`)
    expect(render + staticRenderFns).toMatch(strToRegExp(`attrs:{"append":"node"}`))
    expect(errors).toEqual([])
  })
})
