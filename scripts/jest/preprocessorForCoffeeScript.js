'use strict';

const coffee = require('coffee-script');

module.exports = {
  process(src, filePath) {
    return coffee.compile(src, {bare: true});
  },
};
