var warning = require('./lib/warning');
warning(
  false,
  "require('react/addons') is deprecated. " +
  "Access using require('react-addons-{addon}') instead."
);

module.exports = require('./lib/ReactWithAddons');
