import Vue from 'vue'

function checkPrefixedProp (prop) {
  var el = document.createElement('div')
  var upper = prop.charAt(0).toUpperCase() + prop.slice(1)
  if (!(prop in el.style)) {
    var prefixes = ['Webkit', 'Moz', 'ms']
    var i = prefixes.length
    while (i--) {
      if ((prefixes[i] + upper) in el.style) {
        prop = prefixes[i] + upper
      }
    }
  }
  return prop
}

describe('Directive v-bind:style', () => {
  let vm

  beforeEach(() => {
    vm = new Vue({
      template: '<div :style="styles"></div>',
      data () {
        return {
          styles: {},
          fontSize: 16
        }
      }
    }).$mount()
  })

  it('string', done => {
    vm.styles = 'color:red;'
    waitForUpdate(() => {
      expect(vm.$el.style.cssText.replace(/\s/g, '')).toBe('color:red;')
    }).then(done)
  })

  it('falsy number', done => {
    vm.styles = { opacity: 0 }
    waitForUpdate(() => {
      expect(vm.$el.style.opacity).toBe('0')
    }).then(done)
  })

  it('plain object', done => {
    vm.styles = { color: 'red' }
    waitForUpdate(() => {
      expect(vm.$el.style.cssText.replace(/\s/g, '')).toBe('color:red;')
    }).then(done)
  })

  it('camelCase', done => {
    vm.styles = { marginRight: '10px' }
    waitForUpdate(() => {
      expect(vm.$el.style.marginRight).toBe('10px')
    }).then(done)
  })

  it('remove if falsy value', done => {
    vm.$el.style.color = 'red'
    waitForUpdate(() => {
      vm.styles = { color: null }
    }).then(() => {
      expect(vm.$el.style.color).toBe('')
    }).then(done)
  })

  it('ignore unsupported property', done => {
    vm.styles = { foo: 'bar' }
    waitForUpdate(() => {
      expect(vm.$el.style.foo).not.toBe('bar')
    }).then(done)
  })

  it('auto prefix', done => {
    const prop = checkPrefixedProp('transform')
    const val = 'scale(0.5)'
    vm.styles = { transform: val }
    waitForUpdate(() => {
      expect(vm.$el.style[prop]).toBe(val)
    }).then(done)
  })

  it('auto-prefixed style value as array', done => {
    vm.styles = { display: ['-webkit-box', '-ms-flexbox', 'flex'] }
    const testEl = document.createElement('div')
    vm.styles.display.forEach(value => {
      testEl.style.display = value
    })
    waitForUpdate(() => {
      expect(vm.$el.style.display).toBe(testEl.style.display)
    }).then(done)
  })

  it('!important', done => {
    vm.styles = { display: 'block !important' }
    waitForUpdate(() => {
      expect(vm.$el.style.getPropertyPriority('display')).toBe('important')
    }).then(done)
  })

  it('object with multiple entries', done => {
    vm.$el.style.color = 'red'
    vm.styles = {
      marginLeft: '10px',
      marginRight: '15px'
    }
    waitForUpdate(() => {
      expect(vm.$el.style.getPropertyValue('color')).toBe('red')
      expect(vm.$el.style.getPropertyValue('margin-left')).toBe('10px')
      expect(vm.$el.style.getPropertyValue('margin-right')).toBe('15px')
      vm.styles = {
        color: 'blue',
        padding: null
      }
    }).then(() => {
      expect(vm.$el.style.getPropertyValue('color')).toBe('blue')
      expect(vm.$el.style.getPropertyValue('padding')).toBeFalsy()
      expect(vm.$el.style.getPropertyValue('margin-left')).toBeFalsy()
      expect(vm.$el.style.getPropertyValue('margin-right')).toBeFalsy()
      // handle falsy value
      vm.styles = null
    }).then(() => {
      expect(vm.$el.style.getPropertyValue('color')).toBeFalsy()
      expect(vm.$el.style.getPropertyValue('padding')).toBeFalsy()
      expect(vm.$el.style.getPropertyValue('margin-left')).toBeFalsy()
      expect(vm.$el.style.getPropertyValue('margin-right')).toBeFalsy()
    }).then(done)
  })

  it('array of objects', done => {
    vm.$el.style.padding = '10px'
    vm.styles = [{ color: 'red' }, { marginRight: '20px' }]

    waitForUpdate(() => {
      expect(vm.$el.style.getPropertyValue('color')).toBe('red')
      expect(vm.$el.style.getPropertyValue('margin-right')).toBe('20px')
      expect(vm.$el.style.getPropertyValue('padding')).toBe('10px')
      vm.styles = [{ color: 'blue' }, { padding: null }]
    }).then(() => {
      expect(vm.$el.style.getPropertyValue('color')).toBe('blue')
      expect(vm.$el.style.getPropertyValue('margin-right')).toBeFalsy()
      expect(vm.$el.style.getPropertyValue('padding')).toBeFalsy()
    }).then(done)
  })

  it('updates objects deeply', done => {
    vm.styles = { display: 'none' }
    waitForUpdate(() => {
      expect(vm.$el.style.display).toBe('none')
      vm.styles.display = 'block'
    }).then(() => {
      expect(vm.$el.style.display).toBe('block')
    }).then(done)
  })

  it('background size with only one value', done => {
    vm.styles = { backgroundSize: '100%' }
    waitForUpdate(() => {
      expect(vm.$el.style.cssText.replace(/\s/g, '')).toMatch(/background-size:100%(auto)?;/)
    }).then(done)
  })

  it('should work with interpolation', done => {
    vm.styles = { fontSize: `${vm.fontSize}px` }
    waitForUpdate(() => {
      expect(vm.$el.style.fontSize).toBe('16px')
    }).then(done)
  })

  const supportCssVariable = () => {
    const el = document.createElement('div')
    el.style.setProperty('--color', 'red')
    return el.style.getPropertyValue('--color') === 'red'
  }

  if (supportCssVariable()) {
    it('CSS variables', done => {
      vm.styles = { '--color': 'red' }
      waitForUpdate(() => {
        expect(vm.$el.style.getPropertyValue('--color')).toBe('red')
      }).then(done)
    })
  }

  it('should merge static style with binding style', () => {
    const vm = new Vue({
      template: '<div style="background: url(https://vuejs.org/images/logo.png);color: blue" :style="test"></div>',
      data: {
        test: { color: 'red', fontSize: '12px' }
      }
    }).$mount()
    const style = vm.$el.style
    expect(style.getPropertyValue('background-image')).toMatch('https://vuejs.org/images/logo.png')
    expect(style.getPropertyValue('color')).toBe('red')
    expect(style.getPropertyValue('font-size')).toBe('12px')
  })

  it('should merge between parent and child', done => {
    const vm = new Vue({
      template: '<child style="text-align: left;margin-right:20px" :style="test"></child>',
      data: {
        test: { color: 'red', fontSize: '12px' }
      },
      components: {
        child: {
          template: '<div style="margin-right:10px;" :style="{marginLeft: marginLeft}"></div>',
          data: () => ({ marginLeft: '16px' })
        }
      }
    }).$mount()
    const style = vm.$el.style
    const child = vm.$children[0]
    const css = style.cssText.replace(/\s/g, '')
    expect(css).toContain('margin-right:20px;')
    expect(css).toContain('margin-left:16px;')
    expect(css).toContain('text-align:left;')
    expect(css).toContain('color:red;')
    expect(css).toContain('font-size:12px;')
    expect(style.color).toBe('red')
    expect(style.marginRight).toBe('20px')
    vm.test.color = 'blue'
    waitForUpdate(() => {
      expect(style.color).toBe('blue')
      child.marginLeft = '30px'
    }).then(() => {
      expect(style.marginLeft).toBe('30px')
      child.fontSize = '30px'
    }).then(() => {
      expect(style.fontSize).toBe('12px')
    }).then(done)
  })

  it('should not pass to child root element', () => {
    const vm = new Vue({
      template: '<child :style="test"></child>',
      data: {
        test: { color: 'red', fontSize: '12px' }
      },
      components: {
        child: {
          template: '<div><nested ref="nested" style="color: blue;text-align:left"></nested></div>',
          components: {
            nested: {
              template: '<div></div>'
            }
          }
        }
      }
    }).$mount()
    const style = vm.$el.style
    expect(style.color).toBe('red')
    expect(style.textAlign).toBe('')
    expect(style.fontSize).toBe('12px')
    expect(vm.$children[0].$refs.nested.$el.style.color).toBe('blue')
  })

  it('should merge between nested components', (done) => {
    const vm = new Vue({
      template: '<child :style="test"></child>',
      data: {
        test: { color: 'red', fontSize: '12px' }
      },
      components: {
        child: {
          template: '<nested style="color: blue;text-align:left"></nested>',
          components: {
            nested: {
              template: '<div style="margin-left: 12px;" :style="nestedStyle"></div>',
              data: () => ({ nestedStyle: { marginLeft: '30px' }})
            }
          }
        }
      }
    }).$mount()
    const style = vm.$el.style
    const child = vm.$children[0].$children[0]
    expect(style.color).toBe('red')
    expect(style.marginLeft).toBe('30px')
    expect(style.textAlign).toBe('left')
    expect(style.fontSize).toBe('12px')
    vm.test.color = 'yellow'
    waitForUpdate(() => {
      child.nestedStyle.marginLeft = '60px'
    }).then(() => {
      expect(style.marginLeft).toBe('60px')
      child.nestedStyle = {
        fontSize: '14px',
        marginLeft: '40px'
      }
    }).then(() => {
      expect(style.fontSize).toBe('12px')
      expect(style.marginLeft).toBe('40px')
    }).then(done)
  })

  it('should not merge for different adjacent elements', (done) => {
    const vm = new Vue({
      template:
        '<div>' +
          '<section style="color: blue" :style="style" v-if="!bool"></section>' +
          '<div></div>' +
          '<section style="margin-top: 12px" v-if="bool"></section>' +
        '</div>',
      data: {
        bool: false,
        style: {
          fontSize: '12px'
        }
      }
    }).$mount()
    const style = vm.$el.children[0].style
    expect(style.fontSize).toBe('12px')
    expect(style.color).toBe('blue')
    waitForUpdate(() => {
      vm.bool = true
    }).then(() => {
      expect(style.color).toBe('')
      expect(style.fontSize).toBe('')
      expect(style.marginTop).toBe('12px')
    }).then(done)
  })

  it('should not merge for v-if, v-else-if and v-else elements', (done) => {
    const vm = new Vue({
      template:
        '<div>' +
          '<section style="color: blue" :style="style" v-if="foo"></section>' +
          '<section style="margin-top: 12px" v-else-if="bar"></section>' +
          '<section style="margin-bottom: 24px" v-else></section>' +
          '<div></div>' +
        '</div>',
      data: {
        foo: true,
        bar: false,
        style: {
          fontSize: '12px'
        }
      }
    }).$mount()
    const style = vm.$el.children[0].style
    expect(style.fontSize).toBe('12px')
    expect(style.color).toBe('blue')
    waitForUpdate(() => {
      vm.foo = false
    }).then(() => {
      expect(style.color).toBe('')
      expect(style.fontSize).toBe('')
      expect(style.marginBottom).toBe('24px')
      vm.bar = true
    }).then(() => {
      expect(style.color).toBe('')
      expect(style.fontSize).toBe('')
      expect(style.marginBottom).toBe('')
      expect(style.marginTop).toBe('12px')
    }).then(done)
  })

  // #5318
  it('should work for elements passed down as a slot', done => {
    const vm = new Vue({
      template: `<test><div :style="style"/></test>`,
      data: {
        style: { color: 'red' }
      },
      components: {
        test: {
          template: `<div><slot/></div>`
        }
      }
    }).$mount()

    expect(vm.$el.children[0].style.color).toBe('red')
    vm.style.color = 'green'
    waitForUpdate(() => {
      expect(vm.$el.children[0].style.color).toBe('green')
    }).then(done)
  })
})
