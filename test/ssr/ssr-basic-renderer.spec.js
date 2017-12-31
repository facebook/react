import Vue from '../../dist/vue.runtime.common.js'
import renderToString from '../../packages/vue-server-renderer/basic'

describe('SSR: basicRenderer', () => {
  it('should work', done => {
    renderToString(new Vue({
      template: `
        <div>
          <p class="hi">yoyo</p>
          <div id="ho" :class="{ red: isRed }"></div>
          <span>{{ test }}</span>
          <input :value="test">
          <img :src="imageUrl">
          <test></test>
          <test-async></test-async>
        </div>
      `,
      data: {
        test: 'hi',
        isRed: true,
        imageUrl: 'https://vuejs.org/images/logo.png'
      },
      components: {
        test: {
          render () {
            return this.$createElement('div', { class: ['a'] }, 'test')
          }
        },
        testAsync (resolve) {
          resolve({
            render () {
              return this.$createElement('span', { class: ['b'] }, 'testAsync')
            }
          })
        }
      }
    }), (err, result) => {
      expect(err).toBeNull()
      expect(result).toContain(
        '<div data-server-rendered="true">' +
          '<p class="hi">yoyo</p> ' +
          '<div id="ho" class="red"></div> ' +
          '<span>hi</span> ' +
          '<input value="hi"> ' +
          '<img src="https://vuejs.org/images/logo.png"> ' +
          '<div class="a">test</div> ' +
          '<span class="b">testAsync</span>' +
        '</div>'
      )
      done()
    })
  })

  // #5941
  it('should work peoperly when accessing $ssrContext in root component', done => {
    let ssrContext
    renderToString(new Vue({
      template: `
        <div></div>
      `,
      created () {
        ssrContext = this.$ssrContext
      }
    }), (err, result) => {
      expect(err).toBeNull()
      expect(ssrContext).toBeUndefined()
      done()
    })
  })
})
