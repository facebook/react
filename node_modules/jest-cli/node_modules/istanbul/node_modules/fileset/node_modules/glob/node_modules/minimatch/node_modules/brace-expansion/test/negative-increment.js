var test = require('tape');
var expand = require('..');

test('negative increment', function(t) {
  t.deepEqual(expand('{3..1}'), ['3', '2', '1']);
  t.deepEqual(expand('{10..8}'), ['10', '9', '8']);
  t.deepEqual(expand('{10..08}'), ['10', '09', '08']);
  t.deepEqual(expand('{c..a}'), ['c', 'b', 'a']);

  t.deepEqual(expand('{4..0..2}'), ['4', '2', '0']);
  t.deepEqual(expand('{4..0..-2}'), ['4', '2', '0']);
  t.deepEqual(expand('{e..a..2}'), ['e', 'c', 'a']);

  t.end();
});
