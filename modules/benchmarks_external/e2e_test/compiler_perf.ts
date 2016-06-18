import {runClickBenchmark, verifyNoBrowserErrors} from '@angular/testing/src/perf_util';

describe('ng1.x compiler benchmark', function() {

  var URL = 'benchmarks_external/src/compiler/compiler_benchmark.html';

  afterEach(verifyNoBrowserErrors);

  it('should log withBinding stats', function(done) {
    runClickBenchmark({
      url: URL,
      buttons: ['#compileWithBindings'],
      id: 'ng1.compile.withBindings',
      params: [{name: 'elements', value: 150, scale: 'linear'}],
      waitForAngular2: false
    }).then(done, done.fail);
  });

  it('should log noBindings stats', function(done) {
    runClickBenchmark({
      url: URL,
      buttons: ['#compileNoBindings'],
      id: 'ng1.compile.noBindings',
      params: [{name: 'elements', value: 150, scale: 'linear'}],
      waitForAngular2: false
    }).then(done, done.fail);
  });

});
