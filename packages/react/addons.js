'use strict';

var warning = require('fbjs/lib/warning');
warning(
  false,
  /* eslint-disable no-useless-concat */
  // Require examples in this string must be split to prevent React's
  // build tools from mistaking them for real requires.
  // Otherwise the build tools will attempt to build a 'react-addons-{addon}' module.
  'require' + "('react/addons') is deprecated. " +
  'Access using require' + "('react-addons-{addon}') instead."
);
/* eslint-enable no-useless-concat */

module.exports = require('./lib/ReactWithAddons');
