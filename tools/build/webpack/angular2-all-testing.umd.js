// this bundle is almost identical to the angular2.umd.js
// the only difference being "testing" exports
exports.core = require('angular2/core');
exports.common = require('angular2/common');
exports.compiler = require('angular2/compiler');
exports.platform = {
  browser: require('angular2/platform/browser'),
  common_dom: require('angular2/platform/common_dom'),

  // this is included as compared to the angular2-all.umd.js bundle
  testing: {
    browser: require('angular2/platform/testing/browser')
  }
};
exports.http = require('angular2/http');
exports.router = require('angular2/router');
exports.router_link_dsl = require('angular2/router/router_link_dsl.js');
exports.instrumentation = require('angular2/instrumentation');
exports.upgrade = require('angular2/upgrade');

// this is included as compared to the angular2-all.umd.js bundle
exports.testing = require('angular2/testing');
exports.http.testing = require('angular2/http/testing');
exports.router.testing = require('angular2/router/testing');
