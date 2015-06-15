'use strict'

function ValidationError (errors) {
  this.name = 'ValidationError'
  this.errors = errors
}

ValidationError.prototype = Error.prototype

module.exports = ValidationError
