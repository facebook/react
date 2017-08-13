'use strict';


if (process.env.NODE_ENV === 'production') {
  // TODO: actually update the build process so this works.
  (require('./cjs/testMinificationUsedDCE.js'))();
  module.exports = require('./cjs/react.production.min.js');
} else {
  module.exports = require('./cjs/react.development.js');
}
