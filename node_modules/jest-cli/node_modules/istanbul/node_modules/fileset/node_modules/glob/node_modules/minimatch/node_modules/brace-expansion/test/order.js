var test = require('tape');
var expand = require('..');

test('order', function(t) {
  t.deepEqual(expand('a{d,c,b}e'), [
    'ade', 'ace', 'abe'
  ]);
  t.end();
});

