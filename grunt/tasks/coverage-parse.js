'use strict';
var grunt = require('grunt');
var path = require('path');
var fs = require('fs');

module.exports = function() {
  var ROOT = path.join(__dirname, '/../..');
  var done = this.async();
  var uncoveredExpressionCount = 0;
  var uncoveredLineCount = 0;

  fs.createReadStream(ROOT + '/coverage.log')
  .pipe(require('coverify/parse')(function(error, results) {
    if (error) {
      grunt.fatal(error);
    }

    Object.keys(results)
      .sort(function(a, b) {
        return results[a].length - results[b].length;
      })
      .reverse()
      .forEach(function(concretePath) {
        if (results[concretePath].length === 0) {
          return;
        }
        var relativePath = concretePath.replace(ROOT, '');
        uncoveredExpressionCount += results[concretePath].length;
        grunt.log.error(results[concretePath].length + ' expressions not covered ' + relativePath);

        results[concretePath].forEach(function(c) {
          uncoveredLineCount += c.code.split('\n').length;
          console.log('txmt://open?url=' + encodeURIComponent('file://' + concretePath) + '&line=' + (c.lineNum + 1) + '&column=' + (c.column[0] + 2));
        });
        console.log('');
      });

    Object.keys(results).sort().forEach(function(concretePath) {
      if (results[concretePath].length > 0) {
        return;
      }
      var relativePath = concretePath.replace(ROOT, '');
      grunt.log.ok('100% coverage ' + relativePath);
    });

    if (uncoveredExpressionCount > 0) {
      grunt.log.error(uncoveredExpressionCount + ' expressions not covered');
    }
    if (uncoveredLineCount > 0) {
      grunt.log.error(uncoveredLineCount + ' lines not covered');
    }
    done();
  }));
};
