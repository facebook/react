import {verifyNoBrowserErrors} from '@angular/testing/src/e2e_util';
import {runBenchmark} from '@angular/testing/src/perf_util';

describe('ng2 naive infinite scroll benchmark', function() {

  var URL = 'benchmarks/src/naive_infinite_scroll/index.html';

  afterEach(verifyNoBrowserErrors);

  [1, 2, 4].forEach(function(appSize) {
    it('should run scroll benchmark and collect stats for appSize = ' + appSize, function(done) {
      runBenchmark({
        url: URL,
        id: 'ng2.naive_infinite_scroll',
        work: function() {
          browser.wait(protractor.until.elementLocated(protractor.By.css('body /deep/ #scrollDiv')),
                       5000);
          $('#reset-btn').click();
          $('#run-btn').click();
          browser.wait(protractor.until.elementLocated(protractor.By.css('#done')), 10000);
        },
        params: [
          {name: 'appSize', value: appSize},
          {name: 'iterationCount', value: 20, scale: 'linear'},
          {name: 'scrollIncrement', value: 40}
        ]
      }).then(done, done.fail);
    });
  });

});
