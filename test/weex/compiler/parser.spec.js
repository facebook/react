import { generateBinding } from '../../../src/platforms/weex/util/parser'

describe('expression parser', () => {
  describe('generateBinding', () => {
    it('primitive literal', () => {
      expect(generateBinding('15')).toEqual(15)
      expect(generateBinding('"xxx"')).toEqual('xxx')
    })

    it('identifiers', () => {
      expect(generateBinding('x')).toEqual({ '@binding': 'x' })
      expect(generateBinding('x.y')).toEqual({ '@binding': 'x.y' })
      expect(generateBinding(`x.y['z']`)).toEqual({ '@binding': `x.y['z']` })
    })

    it('object literal', () => {
      expect(generateBinding('{}')).toEqual({})
      expect(generateBinding('{ abc: 25 }')).toEqual({ abc: 25 })
      expect(generateBinding('{ abc: 25, def: "xxx" }')).toEqual({ abc: 25, def: 'xxx' })
      expect(generateBinding('{ a: 3, b: { bb: "bb", bbb: { bbc: "BBC" } } }'))
        .toEqual({ a: 3, b: { bb: 'bb', bbb: { bbc: 'BBC' }}})
    })

    it('array literal', () => {
      expect(generateBinding('[]')).toEqual([])
      expect(generateBinding('[{ abc: 25 }]')).toEqual([{ abc: 25 }])
      expect(generateBinding('[{ abc: 25, def: ["xxx"] }]')).toEqual([{ abc: 25, def: ['xxx'] }])
      expect(generateBinding('{ a: [3,16], b: [{ bb: ["aa","bb"], bbb: [{bbc:"BBC"}] }] }'))
        .toEqual({ a: [3, 16], b: [{ bb: ['aa', 'bb'], bbb: [{ bbc: 'BBC' }] }] })
    })

    it('expressions', () => {
      expect(generateBinding(`3 + 5`)).toEqual({ '@binding': `3 + 5` })
      expect(generateBinding(`'x' + 2`)).toEqual({ '@binding': `'x' + 2` })
      expect(generateBinding(`\`xx\` + 2`)).toEqual({ '@binding': `\`xx\` + 2` })
      expect(generateBinding(`item.size * 23 + 'px'`)).toEqual({ '@binding': `item.size * 23 + 'px'` })
    })

    it('object bindings', () => {
      expect(generateBinding(`{ color: textColor }`)).toEqual({
        color: { '@binding': 'textColor' }
      })
      expect(generateBinding(`{ color: '#FF' + 66 * 100, fontSize: item.size }`)).toEqual({
        color: { '@binding': `'#FF' + 66 * 100` },
        fontSize: { '@binding': 'item.size' }
      })
      expect(generateBinding(`{
        x: { xx: obj, xy: -2 + 5 },
        y: {
          yy: { yyy: obj.y || yy },
          yz: typeof object.yz === 'string' ? object.yz : ''
        }
      }`)).toEqual({
        x: { xx: { '@binding': 'obj' }, xy: { '@binding': '-2 + 5' }},
        y: {
          yy: { yyy: { '@binding': 'obj.y || yy' }},
          yz: { '@binding': `typeof object.yz === 'string' ? object.yz : ''` }
        }
      })
    })

    it('array bindings', () => {
      expect(generateBinding(`[textColor, 3 + 5, 'string']`)).toEqual([
        { '@binding': 'textColor' },
        { '@binding': '3 + 5' },
        'string'
      ])
      expect(generateBinding(`[
        { color: '#FF' + 66 * -100 },
        item && item.style,
        { fontSize: item.size | 0 }
      ]`)).toEqual([
        { color: { '@binding': `'#FF' + 66 * -100` }},
        { '@binding': 'item && item.style' },
        { fontSize: { '@binding': 'item.size | 0' }}
      ])
      expect(generateBinding(`[{
        x: [{ xx: [fn instanceof Function ? 'function' : '' , 25] }],
        y: {
          yy: [{ yyy: [obj.yy.y, obj.y.yy] }],
          yz: [object.yz, void 0]
        }
      }]`)).toEqual([{
        x: [{ xx: [{ '@binding': `fn instanceof Function ? 'function' : ''` }, 25] }],
        y: {
          yy: [{ yyy: [{ '@binding': 'obj.yy.y' }, { '@binding': 'obj.y.yy' }] }],
          yz: [{ '@binding': 'object.yz' }, { '@binding': 'void 0' }]
        }
      }])
    })

    it('unsupported bindings', () => {
      expect(generateBinding('() => {}')).toEqual('')
      expect(generateBinding('function(){}')).toEqual('')
      expect(generateBinding('(function(){})()')).toEqual('')
      expect(generateBinding('var abc = 35')).toEqual('')
      expect(generateBinding('abc++')).toEqual('')
      expect(generateBinding('x.y(0)')).toEqual('')
      expect(generateBinding('class X {}')).toEqual('')
      expect(generateBinding('if (typeof x == null) { 35 }')).toEqual('')
      expect(generateBinding('while (x == null)')).toEqual('')
      expect(generateBinding('new Function()')).toEqual('')
    })
  })
})
