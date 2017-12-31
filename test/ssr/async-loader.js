const hash = require('hash-sum')

module.exports = function (code) {
  const id = hash(this.request) // simulating vue-loader module id injection
  return code.replace('__MODULE_ID__', id)
}
