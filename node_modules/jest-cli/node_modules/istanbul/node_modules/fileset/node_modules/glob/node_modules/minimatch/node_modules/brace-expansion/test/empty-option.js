var test = require('tape');
var expand = require('..');

test('empty option', function(t) {
  t.deepEqual(expand('-v{,,,,}'), [
    '-v', '-v', '-v', '-v', '-v'
  ]);
  t.end();
});

