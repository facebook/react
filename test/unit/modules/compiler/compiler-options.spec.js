import Vue from 'vue'
import { compile } from 'web/compiler'
import { getAndRemoveAttr } from 'compiler/helpers'

describe('compile options', () => {
  it('should be compiled', () => {
    const { render, staticRenderFns, errors } = compile(`
      <div>
        <input type="text" v-model="msg" required max="8" v-validate:field1.group1.group2>
      </div>
    `, {
        directives: {
          validate (el, dir) {
            if (dir.name === 'validate' && dir.arg) {
              el.validate = {
                field: dir.arg,
                groups: dir.modifiers ? Object.keys(dir.modifiers) : []
              }
            }
          }
        },
        modules: [{
          transformNode (el) {
            el.validators = el.validators || []
            const validators = ['required', 'min', 'max', 'pattern', 'maxlength', 'minlength']
            validators.forEach(name => {
              const rule = getAndRemoveAttr(el, name)
              if (rule !== undefined) {
                el.validators.push({ name, rule })
              }
            })
          },
          genData (el) {
            let data = ''
            if (el.validate) {
              data += `validate:${JSON.stringify(el.validate)},`
            }
            if (el.validators) {
              data += `validators:${JSON.stringify(el.validators)},`
            }
            return data
          },
          transformCode (el, code) {
            // check
            if (!el.validate || !el.validators) {
              return code
            }
            // setup validation result props
            const result = { dirty: false } // define something other prop
            el.validators.forEach(validator => {
              result[validator.name] = null
            })
            // generate code
            return `_c('validate',{props:{
          field:${JSON.stringify(el.validate.field)},
          groups:${JSON.stringify(el.validate.groups)},
          validators:${JSON.stringify(el.validators)},
          result:${JSON.stringify(result)},
          child:${code}}
        })`
          }
        }]
      })
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).toEqual([])
    expect(errors).toEqual([])

    const renderFn = new Function(render)
    const vm = new Vue({
      data: {
        msg: 'hello'
      },
      components: {
        validate: {
          props: ['field', 'groups', 'validators', 'result', 'child'],
          render (h) {
            return this.child
          },
          computed: {
            valid () {
              let ret = true
              for (let i = 0; i > this.validators.length; i++) {
                const { name } = this.validators[i]
                if (!this.result[name]) {
                  ret = false
                  break
                }
              }
              return ret
            }
          },
          mounted () {
            // initialize validation
            const value = this.$el.value
            this.validators.forEach(validator => {
              const ret = this[validator.name](value, validator.rule)
              this.result[validator.name] = ret
            })
          },
          methods: {
            // something validators logic
            required (val) {
              return val.length > 0
            },
            max (val, rule) {
              return !(parseInt(val, 10) > parseInt(rule, 10))
            }
          }
        }
      },
      render: renderFn,
      staticRenderFns
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<input type="text">')
    expect(vm.$children[0].valid).toBe(true)
  })

  it('should collect errors', () => {
    let compiled = compile('hello')
    expect(compiled.errors.length).toBe(1)
    expect(compiled.errors[0]).toContain('root element')

    compiled = compile('<div v-if="a----">{{ b++++ }}</div>')
    expect(compiled.errors.length).toBe(2)
    expect(compiled.errors[0]).toContain('Raw expression: v-if="a----"')
    expect(compiled.errors[1]).toContain('Raw expression: {{ b++++ }}')
  })
})
