import { compile } from '../../../packages/weex-template-compiler'
import { strToRegExp } from '../helpers/index'

describe('compile basic', () => {
  it('should be compiled', () => {
    const { render, staticRenderFns, errors } = compile(`<div>{{hi}}</div>`)
    expect(render).toEqual(`with(this){return _c('div',[_v(_s(hi))])}`)
    expect(staticRenderFns.length).toBe(0)
    expect(errors).toEqual([])
  })

  it('should compile data bindings', () => {
    const { render, staticRenderFns, errors } = compile(`<div :a="b"></div>`)
    expect(render).toEqual(`with(this){return _c('div',{attrs:{"a":b}})}`)
    expect(staticRenderFns).toEqual([])
    expect(errors).toEqual([])
  })

  it('should compile event bindings', () => {
    const { render, staticRenderFns, errors } = compile(`<div @click="x"></div>`)
    expect(render).toEqual(`with(this){return _c('div',{on:{"click":x}})}`)
    expect(staticRenderFns).toEqual([])
    expect(errors).toEqual([])
  })

  it('should compile data bindings with children', () => {
    const { render, staticRenderFns, errors } = compile(`<foo :a="b"><text>Hello</text></foo>`)
    expect(render).toEqual(`with(this){return _c('foo',{attrs:{"a":b}},[_c('text',[_v("Hello")])])}`)
    expect(staticRenderFns).toEqual([])
    expect(errors).toEqual([])
  })

  it('should compile unary tag', () => {
    const inputCase = compile(`<div><input><text>abc</text></div>`)
    expect(inputCase.render).toMatch(strToRegExp(`return _m(0)`))
    expect(inputCase.staticRenderFns).toMatch(strToRegExp(`_c('div',[_c('input'),_c('text',[_v("abc")])])`))
    expect(inputCase.errors).toEqual([])

    const imageCase = compile(`<div><image src="path"><text>abc</text></div>`)
    expect(imageCase.render).toMatch(strToRegExp(`return _m(0)`))
    expect(imageCase.staticRenderFns).toMatch(strToRegExp(`_c('div',[_c('image',{attrs:{"src":"path"}}),_c('text',[_v("abc")])])`))
    expect(imageCase.errors).toEqual([])

    const complexCase = compile(`
      <div>
        <image src="path">
        <image></image>
        <div>
          <embed>
          <text>start</text>
          <input type="text">
          <input type="url" />
          <text>end</text>
        </div>
      </div>
    `)
    expect(complexCase.render).toMatch(strToRegExp(`return _m(0)`))
    expect(complexCase.staticRenderFns).toMatch(strToRegExp(`_c('image',{attrs:{"src":"path"}}),_c('image'),_c('div'`))
    expect(complexCase.staticRenderFns).toMatch(strToRegExp(`_c('div',[_c('embed'),_c('text',[_v("start")]),_c('input',{attrs:{"type":"text"}}),_c('input',{attrs:{"type":"url"}}),_c('text',[_v("end")])]`))
    expect(complexCase.errors).toEqual([])
  })

  it('should compile more complex situation', () => {
    // from examples of https://github.com/alibaba/weex
    const { render, staticRenderFns, errors } = compile(`
      <refresh class="refresh" @refresh="handleRefresh" :display="displayRefresh"
        style="flex-direction:row;">
        <loading-indicator></loading-indicator>
        <text style="margin-left:36px;color:#eee;">Load more...</text>
      </refresh>
    `)
    expect(render).toEqual(`with(this){return _c('refresh',{staticClass:["refresh"],staticStyle:{flexDirection:"row"},attrs:{"display":displayRefresh},on:{"refresh":handleRefresh}},[_c('loading-indicator'),_c('text',{staticStyle:{marginLeft:"36px",color:"#eee"}},[_v("Load more...")])])}`)
    expect(staticRenderFns).toEqual([])
    expect(errors).toEqual([])
  })
})
