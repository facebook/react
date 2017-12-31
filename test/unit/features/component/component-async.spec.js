import Vue from 'vue'
import { Promise } from 'es6-promise'

describe('Component async', () => {
  it('normal', done => {
    const vm = new Vue({
      template: '<div><test></test></div>',
      components: {
        test: (resolve) => {
          setTimeout(() => {
            resolve({
              template: '<div>hi</div>'
            })
            // wait for parent update
            Vue.nextTick(next)
          }, 0)
        }
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<!---->')
    expect(vm.$children.length).toBe(0)
    function next () {
      expect(vm.$el.innerHTML).toBe('<div>hi</div>')
      expect(vm.$children.length).toBe(1)
      done()
    }
  })

  it('resolve ES module default', done => {
    const vm = new Vue({
      template: '<div><test></test></div>',
      components: {
        test: (resolve) => {
          setTimeout(() => {
            resolve({
              __esModule: true,
              default: {
                template: '<div>hi</div>'
              }
            })
            // wait for parent update
            Vue.nextTick(next)
          }, 0)
        }
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<!---->')
    expect(vm.$children.length).toBe(0)
    function next () {
      expect(vm.$el.innerHTML).toBe('<div>hi</div>')
      expect(vm.$children.length).toBe(1)
      done()
    }
  })

  it('as root', done => {
    const vm = new Vue({
      template: '<test></test>',
      components: {
        test: resolve => {
          setTimeout(() => {
            resolve({
              template: '<div>hi</div>'
            })
            // wait for parent update
            Vue.nextTick(next)
          }, 0)
        }
      }
    }).$mount()
    expect(vm.$el.nodeType).toBe(8)
    expect(vm.$children.length).toBe(0)
    function next () {
      expect(vm.$el.nodeType).toBe(1)
      expect(vm.$el.outerHTML).toBe('<div>hi</div>')
      expect(vm.$children.length).toBe(1)
      done()
    }
  })

  it('dynamic', done => {
    var vm = new Vue({
      template: '<component :is="view"></component>',
      data: {
        view: 'view-a'
      },
      components: {
        'view-a': resolve => {
          setTimeout(() => {
            resolve({
              template: '<div>A</div>'
            })
            Vue.nextTick(step1)
          }, 0)
        },
        'view-b': resolve => {
          setTimeout(() => {
            resolve({
              template: '<p>B</p>'
            })
            Vue.nextTick(step2)
          }, 0)
        }
      }
    }).$mount()
    var aCalled = false
    function step1 () {
      // ensure A is resolved only once
      expect(aCalled).toBe(false)
      aCalled = true
      expect(vm.$el.tagName).toBe('DIV')
      expect(vm.$el.textContent).toBe('A')
      vm.view = 'view-b'
    }
    function step2 () {
      expect(vm.$el.tagName).toBe('P')
      expect(vm.$el.textContent).toBe('B')
      vm.view = 'view-a'
      waitForUpdate(function () {
        expect(vm.$el.tagName).toBe('DIV')
        expect(vm.$el.textContent).toBe('A')
      }).then(done)
    }
  })

  it('warn reject', () => {
    new Vue({
      template: '<test></test>',
      components: {
        test: (resolve, reject) => {
          reject('nooooo')
        }
      }
    }).$mount()
    expect('Reason: nooooo').toHaveBeenWarned()
  })

  it('with v-for', done => {
    const vm = new Vue({
      template: '<div><test v-for="n in list" :key="n" :n="n"></test></div>',
      data: {
        list: [1, 2, 3]
      },
      components: {
        test: resolve => {
          setTimeout(() => {
            resolve({
              props: ['n'],
              template: '<div>{{n}}</div>'
            })
            Vue.nextTick(next)
          }, 0)
        }
      }
    }).$mount()
    function next () {
      expect(vm.$el.innerHTML).toBe('<div>1</div><div>2</div><div>3</div>')
      done()
    }
  })

  it('returning Promise', done => {
    const vm = new Vue({
      template: '<div><test></test></div>',
      components: {
        test: () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                template: '<div>hi</div>'
              })
              // wait for promise resolve and then parent update
              Promise.resolve().then(() => {
                Vue.nextTick(next)
              })
            }, 0)
          })
        }
      }
    }).$mount()
    expect(vm.$el.innerHTML).toBe('<!---->')
    expect(vm.$children.length).toBe(0)
    function next () {
      expect(vm.$el.innerHTML).toBe('<div>hi</div>')
      expect(vm.$children.length).toBe(1)
      done()
    }
  })

  describe('loading/error/timeout', () => {
    it('with loading component', done => {
      const vm = new Vue({
        template: `<div><test/></div>`,
        components: {
          test: () => ({
            component: new Promise(resolve => {
              setTimeout(() => {
                resolve({ template: '<div>hi</div>' })
                // wait for promise resolve and then parent update
                Promise.resolve().then(() => {
                  Vue.nextTick(next)
                })
              }, 50)
            }),
            loading: { template: `<div>loading</div>` },
            delay: 1
          })
        }
      }).$mount()

      expect(vm.$el.innerHTML).toBe('<!---->')

      let loadingAsserted = false
      setTimeout(() => {
        Vue.nextTick(() => {
          loadingAsserted = true
          expect(vm.$el.textContent).toBe('loading')
        })
      }, 1)

      function next () {
        expect(loadingAsserted).toBe(true)
        expect(vm.$el.textContent).toBe('hi')
        done()
      }
    })

    it('with loading component (0 delay)', done => {
      const vm = new Vue({
        template: `<div><test/></div>`,
        components: {
          test: () => ({
            component: new Promise(resolve => {
              setTimeout(() => {
                resolve({ template: '<div>hi</div>' })
                // wait for promise resolve and then parent update
                Promise.resolve().then(() => {
                  Vue.nextTick(next)
                })
              }, 50)
            }),
            loading: { template: `<div>loading</div>` },
            delay: 0
          })
        }
      }).$mount()

      expect(vm.$el.textContent).toBe('loading')

      function next () {
        expect(vm.$el.textContent).toBe('hi')
        done()
      }
    })

    it('with error component', done => {
      const vm = new Vue({
        template: `<div><test/></div>`,
        components: {
          test: () => ({
            component: new Promise((resolve, reject) => {
              setTimeout(() => {
                reject()
                // wait for promise resolve and then parent update
                Promise.resolve().then(() => {
                  Vue.nextTick(next)
                })
              }, 50)
            }),
            loading: { template: `<div>loading</div>` },
            error: { template: `<div>error</div>` },
            delay: 0
          })
        }
      }).$mount()

      expect(vm.$el.textContent).toBe('loading')

      function next () {
        expect(`Failed to resolve async component`).toHaveBeenWarned()
        expect(vm.$el.textContent).toBe('error')
        done()
      }
    })

    it('with error component + timeout', done => {
      const vm = new Vue({
        template: `<div><test/></div>`,
        components: {
          test: () => ({
            component: new Promise((resolve, reject) => {
              setTimeout(() => {
                resolve({ template: '<div>hi</div>' })
                // wait for promise resolve and then parent update
                Promise.resolve().then(() => {
                  Vue.nextTick(next)
                })
              }, 50)
            }),
            loading: { template: `<div>loading</div>` },
            error: { template: `<div>error</div>` },
            delay: 0,
            timeout: 1
          })
        }
      }).$mount()

      expect(vm.$el.textContent).toBe('loading')

      setTimeout(() => {
        Vue.nextTick(() => {
          expect(`Failed to resolve async component`).toHaveBeenWarned()
          expect(vm.$el.textContent).toBe('error')
        })
      }, 1)

      function next () {
        expect(vm.$el.textContent).toBe('error') // late resolve ignored
        done()
      }
    })

    it('should not trigger timeout if resolved', done => {
      const vm = new Vue({
        template: `<div><test/></div>`,
        components: {
          test: () => ({
            component: new Promise((resolve, reject) => {
              setTimeout(() => {
                resolve({ template: '<div>hi</div>' })
              }, 10)
            }),
            error: { template: `<div>error</div>` },
            timeout: 20
          })
        }
      }).$mount()

      setTimeout(() => {
        expect(vm.$el.textContent).toBe('hi')
        expect(`Failed to resolve async component`).not.toHaveBeenWarned()
        done()
      }, 50)
    })

    // #7107
    it(`should work when resolving sync in sibling component's mounted hook`, done => {
      let resolveTwo

      const vm = new Vue({
        template: `<div><one/> <two/></div>`,
        components: {
          one: {
            template: `<div>one</div>`,
            mounted () {
              resolveTwo()
            }
          },
          two: resolve => {
            resolveTwo = () => {
              resolve({
                template: `<div>two</div>`
              })
            }
          }
        }
      }).$mount()

      expect(vm.$el.textContent).toBe('one ')
      waitForUpdate(() => {
        expect(vm.$el.textContent).toBe('one two')
      }).then(done)
    })
  })
})
