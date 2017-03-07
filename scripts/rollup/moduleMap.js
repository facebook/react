"use strict";

const { resolve, basename } = require('path');
const { sync } = require('glob');

const exclude = [
  'src/**/__benchmarks__/**/*.js',
  'src/**/__tests__/**/*.js',
  'src/**/__mocks__/**/*.js',
]

function createModuleMap(paths) {
  const moduleMap = {};

  paths.forEach(path => {
    const files = sync(path, exclude);
    
    files.forEach(file => {
      const moduleName = basename(file, '.js');

      moduleMap[moduleName] = resolve(file);
    });
  });
  return moduleMap;
}

module.exports = {
  createModuleMap,
};
