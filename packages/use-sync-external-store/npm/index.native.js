'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/use-sync-external-store.native.production.min.js');
} else {
  module.exports = require('./cjs/use-sync-external-store.native.development.js');
}
