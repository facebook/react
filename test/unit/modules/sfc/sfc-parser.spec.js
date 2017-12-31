import { parseComponent } from 'sfc/parser'

describe('Single File Component parser', () => {
  it('should parse', () => {
    const res = parseComponent(`
      <template>
        <div>hi</div>
      </template>
      <style src="./test.css"></style>
      <style lang="stylus" scoped>
        h1
          color red
        h2
          color green
      </style>
      <style module>
        h1 { font-weight: bold }
      </style>
      <style bool-attr val-attr="test"></style>
      <script>
        export default {}
      </script>
      <div>
        <style>nested should be ignored</style>
      </div>
    `)
    expect(res.template.content.trim()).toBe('<div>hi</div>')
    expect(res.styles.length).toBe(4)
    expect(res.styles[0].src).toBe('./test.css')
    expect(res.styles[1].lang).toBe('stylus')
    expect(res.styles[1].scoped).toBe(true)
    expect(res.styles[1].content.trim()).toBe('h1\n  color red\nh2\n  color green')
    expect(res.styles[2].module).toBe(true)
    expect(res.styles[3].attrs['bool-attr']).toBe(true)
    expect(res.styles[3].attrs['val-attr']).toBe('test')
    expect(res.script.content.trim()).toBe('export default {}')
  })

  it('should parse template with closed input', () => {
    const res = parseComponent(`
      <template>
        <input type="text"/>
      </template>
    `)

    expect(res.template.content.trim()).toBe('<input type="text"/>')
  })

  it('should handle nested template', () => {
    const res = parseComponent(`
      <template>
        <div><template v-if="ok">hi</template></div>
      </template>
    `)
    expect(res.template.content.trim()).toBe('<div><template v-if="ok">hi</template></div>')
  })

  it('pad content', () => {
    const content = `
      <template>
        <div></div>
      </template>
      <script>
        export default {}
      </script>
      <style>
        h1 { color: red }
      </style>
`
    const padDefault = parseComponent(content.trim(), { pad: true })
    const padLine = parseComponent(content.trim(), { pad: 'line' })
    const padSpace = parseComponent(content.trim(), { pad: 'space' })

    expect(padDefault.script.content).toBe(Array(3 + 1).join('//\n') + '\nexport default {}\n')
    expect(padDefault.styles[0].content).toBe(Array(6 + 1).join('\n') + '\nh1 { color: red }\n')
    expect(padLine.script.content).toBe(Array(3 + 1).join('//\n') + '\nexport default {}\n')
    expect(padLine.styles[0].content).toBe(Array(6 + 1).join('\n') + '\nh1 { color: red }\n')
    expect(padSpace.script.content).toBe(`<template>
        <div></div>
      </template>
      <script>`.replace(/./g, ' ') + '\nexport default {}\n')
    expect(padSpace.styles[0].content).toBe(`<template>
        <div></div>
      </template>
      <script>
        export default {}
      </script>
      <style>`.replace(/./g, ' ') + '\nh1 { color: red }\n')
  })

  it('should handle template blocks with lang as special text', () => {
    const res = parseComponent(`
      <template lang="pug">
        div
          h1(v-if='1 < 2') hello
      </template>
    `)
    expect(res.template.content.trim()).toBe(`div\n  h1(v-if='1 < 2') hello`)
  })

  it('should handle component contains "<" only', () => {
    const res = parseComponent(`
      <template>
        <span><</span>
      </template>
    `)
    expect(res.template.content.trim()).toBe(`<span><</span>`)
  })

  it('should handle custom blocks without parsing them', () => {
    const res = parseComponent(`
      <template>
        <div></div>
      </template>
      <example name="simple">
        <my-button ref="button">Hello</my-button>
      </example>
      <example name="with props">
        <my-button color="red">Hello</my-button>
      </example>
      <test name="simple" foo="bar">
      export default function simple (vm) {
        describe('Hello', () => {
          it('should display Hello', () => {
            this.vm.$refs.button.$el.innerText.should.equal('Hello')
          }))
        }))
      }
      </test>
    `)
    expect(res.customBlocks.length).toBe(3)

    const simpleExample = res.customBlocks[0]
    expect(simpleExample.type).toBe('example')
    expect(simpleExample.content.trim()).toBe('<my-button ref="button">Hello</my-button>')
    expect(simpleExample.attrs.name).toBe('simple')

    const withProps = res.customBlocks[1]
    expect(withProps.type).toBe('example')
    expect(withProps.content.trim()).toBe('<my-button color="red">Hello</my-button>')
    expect(withProps.attrs.name).toBe('with props')

    const simpleTest = res.customBlocks[2]
    expect(simpleTest.type).toBe('test')
    expect(simpleTest.content.trim()).toBe(`export default function simple (vm) {
  describe('Hello', () => {
    it('should display Hello', () => {
      this.vm.$refs.button.$el.innerText.should.equal('Hello')
    }))
  }))
}`)
    expect(simpleTest.attrs.name).toBe('simple')
    expect(simpleTest.attrs.foo).toBe('bar')
  })

  // Regression #4289
  it('accepts nested template tag', () => {
    const raw = `<div>
      <template v-if="true === true">
        <section class="section">
          <div class="container">
            Should be shown
          </div>
        </section>
      </template>
      <template v-else>
        <p>Should not be shown</p>
      </template>
    </div>`
    const res = parseComponent(`<template>${raw}</template>`)
    expect(res.template.content.trim()).toBe(raw)
  })

  it('should not hang on trailing text', () => {
    const res = parseComponent(`<template>hi</`)
    expect(res.template.content).toBe('hi')
  })
})
