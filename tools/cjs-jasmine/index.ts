'use strict';

var glob = require('glob');
var JasmineRunner = require('jasmine');
var path = require('path');
// require('es6-shim/es6-shim.js');
require('zone.js/dist/zone-node.js');
require('zone.js/dist/long-stack-trace-zone.js');
require('zone.js/dist/async-test.js');
require('zone.js/dist/fake-async-test.js');
require('reflect-metadata/Reflect');

var jrunner = new JasmineRunner();
var distAll: string = process.cwd() + '/dist/all';
function distAllRequire(moduleId: string) {
  return require(path.join(distAll, moduleId));
}


// Tun on full stack traces in errors to help debugging
(<any>Error)['stackTraceLimit'] = Infinity;

jrunner.jasmine.DEFAULT_TIMEOUT_INTERVAL = 100;

// Support passing multiple globs
var globsIndex = process.argv.indexOf('--');
var args: string[];
if (globsIndex < 0) {
  args = [process.argv[2]];
} else {
  args = process.argv.slice(globsIndex + 1);
}

var specFiles: any =
    args.map(function(globstr: string):
                 string[] {
                   return glob.sync(globstr, {
                     cwd: distAll,
                     ignore: [
                       // the following code and tests are not compatible with CJS/node environment
                       '@angular/platform-browser/**',
                       '@angular/platform-browser-dynamic/**',
                       '@angular/core/test/zone/**',
                       '@angular/core/test/fake_async_spec.*',
                       '@angular/forms/test/**',
                       '@angular/common/test/forms-deprecated/**',
                       '@angular/router/test/route_config/route_config_spec.*',
                       '@angular/router/test/integration/bootstrap_spec.*',
                       '@angular/integration_test/symbol_inspector/**',
                       '@angular/upgrade/**',
                       '@angular/examples/**',
                       'angular1_router/**',
                       'payload_tests/**',
                     ]
                   });
                 })
        // The security spec however works (and must work!) on the server side.
        .concat(glob.sync('@angular/platform-browser/test/security/**/*_spec.js', {cwd: distAll}))
        .reduce((specFiles: string[], paths: string[]) => specFiles.concat(paths), <string[]>[]);

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100;

jrunner.configureDefaultReporter({showColors: process.argv.indexOf('--no-color') === -1});

jrunner.onComplete(function(passed: boolean) { process.exit(passed ? 0 : 1); });
jrunner.projectBaseDir = path.resolve(__dirname, '../../');
jrunner.specDir = '';
require('./test-cjs-main.js');
require('zone.js/dist/jasmine-patch.js');
distAllRequire('@angular/platform-server/src/parse5_adapter.js').Parse5DomAdapter.makeCurrent();
specFiles.forEach((file: string) => {
  var r = distAllRequire(file);
  if (r.main) r.main();
});
jrunner.execute();
