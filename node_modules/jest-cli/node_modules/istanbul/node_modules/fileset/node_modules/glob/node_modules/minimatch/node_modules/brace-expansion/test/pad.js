var test = require('tape');
var expand = require('..');

test('pad', function(t) {
  t.deepEqual(expand('{9..11}'), [
    '9', '10', '11'
  ]);
  t.deepEqual(expand('{09..11}'), [
    '09', '10', '11'
  ]);
  t.end();
});

