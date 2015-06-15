var test = require('tape');
var expand = require('..');

test('ignores ${', function(t) {
  t.deepEqual(expand('${1..3}'), ['${1..3}']);
  t.deepEqual(expand('${a,b}${c,d}'), ['${a,b}${c,d}']);
  t.deepEqual(expand('x${a,b}x${c,d}x'), ['x${a,b}x${c,d}x']);
  t.end();
});
