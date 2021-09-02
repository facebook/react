'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/use-sync-external-store-extra.production.min.js');
} else {
  module.exports = require('./cjs/use-sync-external-store-extra.development.js');
}
