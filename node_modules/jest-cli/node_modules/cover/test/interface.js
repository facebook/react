var assert = require('assert');
var runforcover = require('../');

exports.coverageInterface = function() {
  assert.ok(runforcover.cover);

  var originalRequire = require.extensions['.js'];

  var coverage = runforcover.cover();

  assert.notEqual(originalRequire, require.extensions['.js']);

  var file = require('./src/coverage');

  coverage(function(coverageData) {
    assert.equal(Object.keys(coverageData).length, 1);
    assert.equal(Object.keys(coverageData)[0], __dirname + '/src/coverage.js');

    var fileCoverageData = coverageData[Object.keys(coverageData)[0]]; 

    assert.ok(fileCoverageData.stats);
    assert.ok(fileCoverageData.missing);

    var stats = fileCoverageData.stats();

    assert.ok(stats.percentage !== undefined);
    assert.ok(stats.lines !== undefined);
    assert.ok(stats.missing !== undefined);
    assert.ok(stats.seen !== undefined);

    assert.equal(stats.lines.length, 3);
    assert.equal(stats.lines[0].source(), '  if(a > 0) {');
    assert.equal(stats.lines[1].source(), '    return a + 1;');
    assert.equal(stats.lines[2].source(), '    return a - 1;');

    file.something(1);
    stats = fileCoverageData.stats();

    assert.equal(stats.lines.length, 1);
    assert.equal(stats.lines[0].source(), '    return a - 1;');

    file.something(-1);
    stats = fileCoverageData.stats();

    assert.equal(stats.lines.length, 0);

    coverage.release();
    assert.equal(require.extensions['.js'], originalRequire); 
  });
};
