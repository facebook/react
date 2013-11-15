var grunt = require('grunt');

module.exports = function(){
  var ROOT = require('path').normalize(__dirname + '/../..');
  var done = this.async();
  var uncoveredExpressionCount = 0;
  var uncoveredLineCount = 0;
  
  require('fs').createReadStream(ROOT + '/coverage.log')
  .pipe(require('coverify/parse')(function(error, results){
    if (error) grunt.fatal(error);
    
    Object.keys(results)
    .sort(function(a, b){
      if (results[a].length > results[b].length) return -1;
      if (results[a].length < results[b].length) return 1;
      return 0;
    })
    .forEach(function(path){
      if (results[path].length === 0) return;
      var relativePath = path.replace(ROOT, '');
      uncoveredExpressionCount += results[path].length;
      grunt.log.error(results[path].length + ' expressions not covered ' + relativePath);

      results[path].forEach(function(c){
        uncoveredLineCount += c.code.split('\n').length;
        // console.log(
        //   'https://github.com/' + process.env.TRAVIS_REPO_SLUG + '/blob/' + process.env.TRAVIS_BRANCH + relativePath + '#L' + (c.lineNum+1) + '-L' + (c.lineNum+1 + c.code.split('\n').length)
        // );
        console.log(
          'txmt://open?url=' + encodeURIComponent('file://' + path) + '&line=' + (c.lineNum+1) + '&column=' + (c.column[0]+2)
        );
        // console.log(c.code.split('\n').map(function(line){return '\t' + line}).join('\n'))
      });
      console.log('');
    });

    Object.keys(results).sort().forEach(function(path){
      if (results[path].length > 0) return;
      var relativePath = path.replace(ROOT, '');
      grunt.log.ok('100% coverage ' + relativePath);
    });
    
    if (uncoveredExpressionCount > 0) grunt.log.error(uncoveredExpressionCount + ' expressions not covered');
    if (uncoveredLineCount > 0) grunt.log.error(uncoveredLineCount + ' lines not covered');
    done();
  }));
}