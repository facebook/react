"use strict";

var crypto = require('crypto');
var fs = require('fs-extra');
var path = require('path');

var getAllVisitors = require('./vendor/fbtransform/visitors').getAllVisitors;
var propagate = require("./vendor/constants").propagate;
var transform = require('jstransform').transform;

function sha1(text) {
  var hash = crypto.createHash('sha1');
  hash.update(text);
  return hash.digest('hex');
}

function cache(key, fn) {
  return function(source) {
    var name = sha1(source);
    var cacheFile = '.module-cache/' + key + '/' + name;
    if (fs.existsSync(cacheFile)) {
      return fs.readFileSync(cacheFile);
    } else {
      var out = fn(source);
      fs.mkdirs(path.dirname(cacheFile));
      fs.writeFileSync(cacheFile, out);
      return out;
    }
  };
}

var diskCachedTransform = cache('webpack-jsx-v1', function(source) {
  source = transform(getAllVisitors(), source).code;
  source = propagate({}, source);
  return source;
});

module.exports = function(source) {
  this.cacheable();
  return diskCachedTransform(source);
};
