'use strict';

var fileName = process.env.NODE_ENV === 'production' ? 'react.production.min.js' : 'react.development.js';
module.exports = require('./cjs/' + fileName);
