'use strict';

const {readdirSync, statSync} = require('fs');
const {join} = require('path');
const baseConfig = require('./config.base');

// Find all folders in packages/* with package.json
const packagesRoot = join(__dirname, '..', '..', 'packages');
const packages = readdirSync(packagesRoot).filter(dir => {
  if (dir.charAt(0) === '.') {
    return false;
  }
  const packagePath = join(packagesRoot, dir, 'package.json');
  return statSync(packagePath).isFile();
});
// Create a module map to point React packages to the build output
const moduleNameMapper = {};
packages.forEach(name => {
  // Root entry point
  moduleNameMapper[`^${name}$`] = `<rootDir>/build/node_modules/${name}`;
  // Named entry points
  moduleNameMapper[
    `^${name}/(.*)$`
  ] = `<rootDir>/build/node_modules/${name}/$1`;
});

module.exports = Object.assign({}, baseConfig, {
  // Redirect imports to the compiled bundles
  moduleNameMapper,
  // Don't run bundle tests on blacklisted -test.internal.* files
  testPathIgnorePatterns: ['/node_modules/', '-test.internal.js$'],
  // Exclude the build output from transforms
  transformIgnorePatterns: ['/node_modules/', '<rootDir>/build/'],
});
