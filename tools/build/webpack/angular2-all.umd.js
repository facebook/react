exports.core = require('angular2/core');
exports.common = require('angular2/common');
exports.compiler = require('angular2/compiler');
exports.platform = {
  browser: require('angular2/platform/browser'),
  common_dom: require('angular2/platform/common_dom')
};
exports.http = require('angular2/http');
exports.router = require('angular2/router');
exports.router_link_dsl = require('angular2/router/router_link_dsl.js');
exports.instrumentation = require('angular2/instrumentation');
exports.upgrade = require('angular2/upgrade');
