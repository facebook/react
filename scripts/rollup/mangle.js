'use strict';

// these are added as they are handled by rollup in some cases
const propertyMangleWhitelist = [
  // React
  'React',
  'ReactDOM',
];

module.exports = {
  propertyMangleWhitelist,
};
