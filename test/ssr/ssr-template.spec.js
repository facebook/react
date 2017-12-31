import webpack from 'webpack'
import Vue from '../../dist/vue.runtime.common.js'
import { compileWithWebpack } from './compile-with-webpack'
import { createRenderer } from '../../packages/vue-server-renderer'
import VueSSRClientPlugin from '../../packages/vue-server-renderer/client-plugin'
import { createRenderer as createBundleRenderer } from './ssr-bundle-render.spec.js'

const defaultTemplate = `<html><head></head><body><!--vue-ssr-outlet--></body></html>`
const interpolateTemplate = `<html><head><title>{{ title }}</title></head><body><!--vue-ssr-outlet-->{{{ snippet }}}</body></html>`

function generateClientManifest (file, cb) {
  compileWithWebpack(file, {
    output: {
      path: '/',
      filename: '[name].js'
    },
    plugins: [
      new webpack.optimize.CommonsChunkPlugin({
        name: 'manifest',
        minChunks: Infinity
      }),
      new VueSSRClientPlugin()
    ]
  }, fs => {
    cb(JSON.parse(fs.readFileSync('/vue-ssr-client-manifest.json', 'utf-8')))
  })
}

function createRendererWithManifest (file, options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = null
  }
  generateClientManifest(file, clientManifest => {
    createBundleRenderer(file, Object.assign({
      asBundle: true,
      template: defaultTemplate,
      clientManifest
    }, options), cb)
  })
}

describe('SSR: template option', () => {
  it('renderToString', done => {
    const renderer = createRenderer({
      template: defaultTemplate
    })

    const context = {
      head: '<meta name="viewport" content="width=device-width">',
      styles: '<style>h1 { color: red }</style>',
      state: { a: 1 }
    }

    renderer.renderToString(new Vue({
      template: '<div>hi</div>'
    }), context, (err, res) => {
      expect(err).toBeNull()
      expect(res).toContain(
        `<html><head>${context.head}${context.styles}</head><body>` +
        `<div data-server-rendered="true">hi</div>` +
        `<script>window.__INITIAL_STATE__={"a":1}</script>` +
        `</body></html>`
      )
      done()
    })
  })

  it('renderToString with interpolation', done => {
    const renderer = createRenderer({
      template: interpolateTemplate
    })

    const context = {
      title: '<script>hacks</script>',
      snippet: '<div>foo</div>',
      head: '<meta name="viewport" content="width=device-width">',
      styles: '<style>h1 { color: red }</style>',
      state: { a: 1 }
    }

    renderer.renderToString(new Vue({
      template: '<div>hi</div>'
    }), context, (err, res) => {
      expect(err).toBeNull()
      expect(res).toContain(
        `<html><head>` +
        // double mustache should be escaped
        `<title>&lt;script&gt;hacks&lt;/script&gt;</title>` +
        `${context.head}${context.styles}</head><body>` +
        `<div data-server-rendered="true">hi</div>` +
        `<script>window.__INITIAL_STATE__={"a":1}</script>` +
        // triple should be raw
        `<div>foo</div>` +
        `</body></html>`
      )
      done()
    })
  })

  it('renderToStream', done => {
    const renderer = createRenderer({
      template: defaultTemplate
    })

    const context = {
      head: '<meta name="viewport" content="width=device-width">',
      styles: '<style>h1 { color: red }</style>',
      state: { a: 1 }
    }

    const stream = renderer.renderToStream(new Vue({
      template: '<div>hi</div>'
    }), context)

    let res = ''
    stream.on('data', chunk => {
      res += chunk
    })
    stream.on('end', () => {
      expect(res).toContain(
        `<html><head>${context.head}${context.styles}</head><body>` +
        `<div data-server-rendered="true">hi</div>` +
        `<script>window.__INITIAL_STATE__={"a":1}</script>` +
        `</body></html>`
      )
      done()
    })
  })

  it('renderToStream with interpolation', done => {
    const renderer = createRenderer({
      template: interpolateTemplate
    })

    const context = {
      title: '<script>hacks</script>',
      snippet: '<div>foo</div>',
      head: '<meta name="viewport" content="width=device-width">',
      styles: '<style>h1 { color: red }</style>',
      state: { a: 1 }
    }

    const stream = renderer.renderToStream(new Vue({
      template: '<div>hi</div>'
    }), context)

    let res = ''
    stream.on('data', chunk => {
      res += chunk
    })
    stream.on('end', () => {
      expect(res).toContain(
        `<html><head>` +
        // double mustache should be escaped
        `<title>&lt;script&gt;hacks&lt;/script&gt;</title>` +
        `${context.head}${context.styles}</head><body>` +
        `<div data-server-rendered="true">hi</div>` +
        `<script>window.__INITIAL_STATE__={"a":1}</script>` +
        // triple should be raw
        `<div>foo</div>` +
        `</body></html>`
      )
      done()
    })
  })

  it('bundleRenderer + renderToString', done => {
    createBundleRenderer('app.js', {
      asBundle: true,
      template: defaultTemplate
    }, renderer => {
      const context = {
        head: '<meta name="viewport" content="width=device-width">',
        styles: '<style>h1 { color: red }</style>',
        state: { a: 1 },
        url: '/test'
      }
      renderer.renderToString(context, (err, res) => {
        expect(err).toBeNull()
        expect(res).toContain(
          `<html><head>${context.head}${context.styles}</head><body>` +
          `<div data-server-rendered="true">/test</div>` +
          `<script>window.__INITIAL_STATE__={"a":1}</script>` +
          `</body></html>`
        )
        expect(context.msg).toBe('hello')
        done()
      })
    })
  })

  it('bundleRenderer + renderToStream', done => {
    createBundleRenderer('app.js', {
      asBundle: true,
      template: defaultTemplate
    }, renderer => {
      const context = {
        head: '<meta name="viewport" content="width=device-width">',
        styles: '<style>h1 { color: red }</style>',
        state: { a: 1 },
        url: '/test'
      }
      const stream = renderer.renderToStream(context)
      let res = ''
      stream.on('data', chunk => {
        res += chunk.toString()
      })
      stream.on('end', () => {
        expect(res).toContain(
          `<html><head>${context.head}${context.styles}</head><body>` +
          `<div data-server-rendered="true">/test</div>` +
          `<script>window.__INITIAL_STATE__={"a":1}</script>` +
          `</body></html>`
        )
        expect(context.msg).toBe('hello')
        done()
      })
    })
  })

  const expectedHTMLWithManifest = (options = {}) =>
    `<html><head>` +
      // used chunks should have preload
      `<link rel="preload" href="/manifest.js" as="script">` +
      `<link rel="preload" href="/main.js" as="script">` +
      `<link rel="preload" href="/0.js" as="script">` +
      `<link rel="preload" href="/test.css" as="style">` +
      // images and fonts are only preloaded when explicitly asked for
      (options.preloadOtherAssets ? `<link rel="preload" href="/test.woff2" as="font" type="font/woff2" crossorigin>` : ``) +
      (options.preloadOtherAssets ? `<link rel="preload" href="/test.png" as="image">` : ``) +
      // unused chunks should have prefetch
      (options.noPrefetch ? `` : `<link rel="prefetch" href="/1.js">`) +
      // css assets should be loaded
      `<link rel="stylesheet" href="/test.css">` +
    `</head><body>` +
      `<div data-server-rendered="true"><div>async test.woff2 test.png</div></div>` +
      // state should be inlined before scripts
      `<script>window.${options.stateKey || '__INITIAL_STATE__'}={"a":1}</script>` +
      // manifest chunk should be first
      `<script src="/manifest.js" defer></script>` +
      // async chunks should be before main chunk
      `<script src="/0.js" defer></script>` +
      `<script src="/main.js" defer></script>` +
    `</body></html>`

  createClientManifestAssertions(true)
  createClientManifestAssertions(false)

  function createClientManifestAssertions (runInNewContext) {
    it('bundleRenderer + renderToString + clientManifest ()', done => {
      createRendererWithManifest('split.js', { runInNewContext }, renderer => {
        renderer.renderToString({ state: { a: 1 }}, (err, res) => {
          expect(err).toBeNull()
          expect(res).toContain(expectedHTMLWithManifest())
          done()
        })
      })
    })

    it('bundleRenderer + renderToStream + clientManifest + shouldPreload', done => {
      createRendererWithManifest('split.js', {
        runInNewContext,
        shouldPreload: (file, type) => {
          if (type === 'image' || type === 'script' || type === 'font' || type === 'style') {
            return true
          }
        }
      }, renderer => {
        const stream = renderer.renderToStream({ state: { a: 1 }})
        let res = ''
        stream.on('data', chunk => {
          res += chunk.toString()
        })
        stream.on('end', () => {
          expect(res).toContain(expectedHTMLWithManifest({
            preloadOtherAssets: true
          }))
          done()
        })
      })
    })

    it('bundleRenderer + renderToStream + clientManifest + shouldPrefetch', done => {
      createRendererWithManifest('split.js', {
        runInNewContext,
        shouldPrefetch: (file, type) => {
          if (type === 'script') {
            return false
          }
        }
      }, renderer => {
        const stream = renderer.renderToStream({ state: { a: 1 }})
        let res = ''
        stream.on('data', chunk => {
          res += chunk.toString()
        })
        stream.on('end', () => {
          expect(res).toContain(expectedHTMLWithManifest({
            noPrefetch: true
          }))
          done()
        })
      })
    })

    it('bundleRenderer + renderToString + clientManifest + inject: false', done => {
      createRendererWithManifest('split.js', {
        runInNewContext,
        template: `<html>` +
          `<head>{{{ renderResourceHints() }}}{{{ renderStyles() }}}</head>` +
          `<body><!--vue-ssr-outlet-->{{{ renderState({ windowKey: '__FOO__', contextKey: 'foo' }) }}}{{{ renderScripts() }}}</body>` +
        `</html>`,
        inject: false
      }, renderer => {
        const context = { foo: { a: 1 }}
        renderer.renderToString(context, (err, res) => {
          expect(err).toBeNull()
          expect(res).toContain(expectedHTMLWithManifest({
            stateKey: '__FOO__'
          }))
          done()
        })
      })
    })

    it('bundleRenderer + renderToString + clientManifest + no template', done => {
      createRendererWithManifest('split.js', {
        runInNewContext,
        template: null
      }, renderer => {
        const context = { foo: { a: 1 }}
        renderer.renderToString(context, (err, res) => {
          expect(err).toBeNull()

          const customOutput =
            `<html><head>${
              context.renderResourceHints() +
              context.renderStyles()
            }</head><body>${
              res +
              context.renderState({
                windowKey: '__FOO__',
                contextKey: 'foo'
              }) +
              context.renderScripts()
            }</body></html>`

          expect(customOutput).toContain(expectedHTMLWithManifest({
            stateKey: '__FOO__'
          }))
          done()
        })
      })
    })

    it('whitespace insensitive interpolation', done => {
      const interpolateTemplate = `<html><head><title>{{title}}</title></head><body><!--vue-ssr-outlet-->{{{snippet}}}</body></html>`
      const renderer = createRenderer({
        template: interpolateTemplate
      })

      const context = {
        title: '<script>hacks</script>',
        snippet: '<div>foo</div>',
        head: '<meta name="viewport" content="width=device-width">',
        styles: '<style>h1 { color: red }</style>',
        state: { a: 1 }
      }

      renderer.renderToString(new Vue({
        template: '<div>hi</div>'
      }), context, (err, res) => {
        expect(err).toBeNull()
        expect(res).toContain(
          `<html><head>` +
          // double mustache should be escaped
          `<title>&lt;script&gt;hacks&lt;/script&gt;</title>` +
          `${context.head}${context.styles}</head><body>` +
          `<div data-server-rendered="true">hi</div>` +
          `<script>window.__INITIAL_STATE__={"a":1}</script>` +
          // triple should be raw
          `<div>foo</div>` +
          `</body></html>`
        )
        done()
      })
    })
  }
})
