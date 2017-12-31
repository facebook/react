const { red, yellow } = require('chalk')

const prefix = `[vue-server-renderer-webpack-plugin]`
const warn = exports.warn = msg => console.error(red(`${prefix} ${msg}\n`))
const tip = exports.tip = msg => console.log(yellow(`${prefix} ${msg}\n`))

export const validate = compiler => {
  if (compiler.options.target !== 'node') {
    warn('webpack config `target` should be "node".')
  }

  if (compiler.options.output && compiler.options.output.libraryTarget !== 'commonjs2') {
    warn('webpack config `output.libraryTarget` should be "commonjs2".')
  }

  if (!compiler.options.externals) {
    tip(
      'It is recommended to externalize dependencies in the server build for ' +
      'better build performance.'
    )
  }
}

export { isJS, isCSS } from '../util'
