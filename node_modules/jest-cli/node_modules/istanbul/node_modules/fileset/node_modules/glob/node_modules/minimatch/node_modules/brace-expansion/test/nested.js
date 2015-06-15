var test = require('tape');
var expand = require('..');

test('nested', function(t) {
  t.deepEqual(expand('{a,b{1..3},c}'), [
    'a', 'b1', 'b2', 'b3', 'c'
  ]);
  t.deepEqual(expand('{{A..Z},{a..z}}'),
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
  );
  t.deepEqual(expand('ppp{,config,oe{,conf}}'), [
    'ppp', 'pppconfig', 'pppoe', 'pppoeconf'
  ]);
  t.end();
});

