import {verifyNoBrowserErrors} from '@angular/testing/src/e2e_util';
import {runClickBenchmark} from '@angular/testing/src/perf_util';

describe('ng2 di benchmark', function() {

  var URL = 'benchmarks/src/di/di_benchmark.html';

  afterEach(verifyNoBrowserErrors);

  it('should log the stats for getByToken', function(done) {
    runClickBenchmark({
      url: URL,
      buttons: ['#getByToken'],
      id: 'ng2.di.getByToken',
      params: [{name: 'iterations', value: 20000, scale: 'linear'}],
      microMetrics: {'injectAvg': 'avg time for injection (in ms)'},
      waitForAngular2: false
    }).then(done, done.fail);
  });

  it('should log the stats for getByKey', function(done) {
    runClickBenchmark({
      url: URL,
      buttons: ['#getByKey'],
      id: 'ng2.di.getByKey',
      params: [{name: 'iterations', value: 20000, scale: 'linear'}],
      microMetrics: {'injectAvg': 'avg time for injection (in ms)'},
      waitForAngular2: false
    }).then(done, done.fail);
  });

  it('should log the stats for getChild', function(done) {
    runClickBenchmark({
      url: URL,
      buttons: ['#getChild'],
      id: 'ng2.di.getChild',
      params: [{name: 'iterations', value: 20000, scale: 'linear'}],
      microMetrics: {'injectAvg': 'avg time for getChild (in ms)'},
      waitForAngular2: false
    }).then(done, done.fail);
  });

  it('should log the stats for instantiate', function(done) {
    runClickBenchmark({
      url: URL,
      buttons: ['#instantiate'],
      id: 'ng2.di.instantiate',
      params: [{name: 'iterations', value: 10000, scale: 'linear'}],
      microMetrics: {'injectAvg': 'avg time for instantiate (in ms)'},
      waitForAngular2: false
    }).then(done, done.fail);
  });

  /**
   * This benchmark measures the cost of creating a new injector with a mix
   * of binding types: Type, unresolved, unflattened.
   */
  it('should log the stats for createVariety', function(done) {
    runClickBenchmark({
      url: URL,
      buttons: ['#createVariety'],
      id: 'ng2.di.createVariety',
      params: [{name: 'iterations', value: 10000, scale: 'linear'}],
      microMetrics: {'injectAvg': 'avg time for createVariety (in ms)'},
      waitForAngular2: false
    }).then(done, done.fail);
  });

  /**
   * Same as 'createVariety' benchmark but operates on fully resolved bindings.
   */
  it('should log the stats for createVarietyResolved', function(done) {
    runClickBenchmark({
      url: URL,
      buttons: ['#createVarietyResolved'],
      id: 'ng2.di.createVarietyResolved',
      params: [{name: 'iterations', value: 10000, scale: 'linear'}],
      microMetrics: {'injectAvg': 'avg time for createVarietyResolved (in ms)'},
      waitForAngular2: false
    }).then(done, done.fail);
  });

});
