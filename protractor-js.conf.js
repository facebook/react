var data = module.exports = require('./protractor-shared.js');
var config = data.config;

config.baseUrl = 'http://localhost:8001/';
// TODO: remove exclusion when JS version of scrolling benchmark is available
config.exclude.push('dist/js/cjs/benchmarks_external/e2e_test/naive_infinite_scroll_spec.js');
config.exclude.push('dist/js/cjs/benchmarks_external/e2e_test/naive_infinite_scroll_perf.js');

data.createBenchpressRunner({ lang: 'js' });

