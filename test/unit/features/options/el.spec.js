import Vue from 'vue'

describe('Options el', () => {
  it('basic usage', () => {
    const el = document.createElement('div')
    el.innerHTML = '<span>{{message}}</span>'
    const vm = new Vue({
      el,
      data: { message: 'hello world' }
    })
    expect(vm.$el.tagName).toBe('DIV')
    expect(vm.$el.textContent).toBe(vm.message)
  })

  it('should be replaced when use together with `template` option', () => {
    const el = document.createElement('div')
    el.innerHTML = '<span>{{message}}</span>'
    const vm = new Vue({
      el,
      template: '<p id="app"><span>{{message}}</span></p>',
      data: { message: 'hello world' }
    })
    expect(vm.$el.tagName).toBe('P')
    expect(vm.$el.textContent).toBe(vm.message)
  })

  it('should be replaced when use together with `render` option', () => {
    const el = document.createElement('div')
    el.innerHTML = '<span>{{message}}</span>'
    const vm = new Vue({
      el,
      render (h) {
        return h('p', { staticAttrs: { id: 'app' }}, [
          h('span', {}, [this.message])
        ])
      },
      data: { message: 'hello world' }
    })
    expect(vm.$el.tagName).toBe('P')
    expect(vm.$el.textContent).toBe(vm.message)
  })

  it('svg element', () => {
    const parent = document.createElement('div')
    parent.innerHTML =
      '<svg>' +
        '<text :x="x" :y="y" :fill="color">{{ text }}</text>' +
        '<g><clipPath><foo></foo></clipPath></g>' +
      '</svg>'
    const vm = new Vue({
      el: parent.childNodes[0],
      data: {
        x: 64,
        y: 128,
        color: 'red',
        text: 'svg text'
      }
    })
    expect(vm.$el.tagName).toBe('svg')
    expect(vm.$el.childNodes[0].getAttribute('x')).toBe(vm.x.toString())
    expect(vm.$el.childNodes[0].getAttribute('y')).toBe(vm.y.toString())
    expect(vm.$el.childNodes[0].getAttribute('fill')).toBe(vm.color)
    expect(vm.$el.childNodes[0].textContent).toBe(vm.text)
    // nested, non-explicitly listed SVG elements
    expect(vm.$el.childNodes[1].childNodes[0].namespaceURI).toContain('svg')
    expect(vm.$el.childNodes[1].childNodes[0].childNodes[0].namespaceURI).toContain('svg')
  })

  // https://w3c.github.io/DOM-Parsing/#dfn-serializing-an-attribute-value
  it('properly decode attribute values when parsing templates from DOM', () => {
    const el = document.createElement('div')
    el.innerHTML = '<a href="/a?foo=bar&baz=qux" name="<abc>" single=\'"hi"\'></a>'
    const vm = new Vue({ el })
    expect(vm.$el.children[0].getAttribute('href')).toBe('/a?foo=bar&baz=qux')
    expect(vm.$el.children[0].getAttribute('name')).toBe('<abc>')
    expect(vm.$el.children[0].getAttribute('single')).toBe('"hi"')
  })

  it('decode attribute value newlines when parsing templates from DOM in IE', () => {
    const el = document.createElement('div')
    el.innerHTML = `<a :style="{\ncolor:'red'\n}"></a>`
    const vm = new Vue({ el })
    expect(vm.$el.children[0].style.color).toBe('red')
  })

  it('warn cannot find element', () => {
    new Vue({ el: '#non-existent' })
    expect('Cannot find element: #non-existent').toHaveBeenWarned()
  })
})
