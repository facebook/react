import { compile } from '../../../packages/weex-template-compiler'
import { strToRegExp } from '../helpers/index'

describe('compile props', () => {
  it('custom props', () => {
    const { render, staticRenderFns, errors } = compile(`<div custom="whatever"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).not.toBeUndefined()
    expect(staticRenderFns.length).toEqual(0)
    expect(render).toMatch(strToRegExp(`attrs:{"custom":"whatever"}`))
    expect(errors).toEqual([])
  })

  it('camelize props', () => {
    const { render, staticRenderFns, errors } = compile(`<div kebab-case="whatever"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).not.toBeUndefined()
    expect(staticRenderFns.length).toEqual(0)
    expect(render).toMatch(strToRegExp(`attrs:{"kebabCase":"whatever"}`))
    expect(errors).toEqual([])
  })
})
