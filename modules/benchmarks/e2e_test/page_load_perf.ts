import {verifyNoBrowserErrors} from 'angular2/src/testing/perf_util';

describe('ng2 largetable benchmark', function() {

  var URL = 'benchmarks/src/page_load/page_load.html';
  var runner = global['benchpressRunner'];

  afterEach(verifyNoBrowserErrors);


  it('should log the load time', function(done) {
    runner.sample({
            id: 'loadTime',
            prepare: null,
            microMetrics: null,
            userMetrics:
                {loadTime: 'The time in milliseconds to bootstrap', someConstant: 'Some constant'},
            bindings: [
              benchpress.bind(benchpress.SizeValidator.SAMPLE_SIZE)
                  .toValue(2),
              benchpress.bind(benchpress.RegressionSlopeValidator.SAMPLE_SIZE).toValue(2),
              benchpress.bind(benchpress.RegressionSlopeValidator.METRIC).toValue('someConstant')
            ],
            execute: () => { browser.get(URL); }
          })
        .then(report => {
          expect(report.completeSample.map(val => val.values.someConstant)
                     .every(v => v === 1234567890))
              .toBe(true);
          expect(report.completeSample.map(val => val.values.loadTime)
                     .filter(t => typeof t === 'number' && t > 0)
                     .length)
              .toBeGreaterThan(1);
        })
        .then(done);
  });
});
