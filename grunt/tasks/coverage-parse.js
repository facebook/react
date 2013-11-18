"use strict";
var grunt = require('grunt');

module.exports = function(){
  var ROOT = require('path').normalize(__dirname + '/../..');
  var done = this.async();
  var uncoveredExpressionCount = 0;
  var uncoveredLineCount = 0;

  require('fs').createReadStream(ROOT + '/coverage.log')
  .pipe(require('coverify/parse')(function(error, results){
    if (error) {
      grunt.fatal(error);
    }

    Object.keys(results)
      .sort(function(a, b){
        return results[a].length - results[b].length;
      })
      .reverse()
      .forEach(function(path){
        if (results[path].length === 0) {
          return;
        }
        var relativePath = path.replace(ROOT, '');
        uncoveredExpressionCount += results[path].length;
        grunt.log.error(results[path].length + ' expressions not covered ' + relativePath);

        results[path].forEach(function(c){
          uncoveredLineCount += c.code.split('\n').length;
          console.log('txmt://open?url=' + encodeURIComponent('file://' + path) + '&line=' + (c.lineNum+1) + '&column=' + (c.column[0]+2));
        });
        console.log('');
      })
    ;

    Object.keys(results).sort().forEach(function(path){
      if (results[path].length > 0) {
        return;
      }
      var relativePath = path.replace(ROOT, '');
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
