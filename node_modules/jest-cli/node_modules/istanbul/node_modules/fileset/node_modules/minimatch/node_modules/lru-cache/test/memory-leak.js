#!/usr/bin/env node --expose_gc

var weak = require('weak');
var test = require('tap').test
var LRU = require('../')
var l = new LRU({ max: 10 })
var refs = 0
function X() {
  refs ++
  weak(this, deref)
}

function deref() {
  refs --
}

test('no leaks', function (t) {
  // fill up the cache
  for (var i = 0; i < 100; i++) {
    l.set(i, new X);
    // throw some gets in there, too.
    if (i % 2 === 0)
      l.get(i / 2)
  }

  gc()

  var start = process.memoryUsage()

  // capture the memory
  var startRefs = refs

  // do it again, but more
  for (var i = 0; i < 10000; i++) {
    l.set(i, new X);
    // throw some gets in there, too.
    if (i % 2 === 0)
      l.get(i / 2)
  }

  gc()

  var end = process.memoryUsage()
  t.equal(refs, startRefs, 'no leaky refs')

  console.error('start: %j\n' +
                'end:   %j', start, end);
  t.pass();
  t.end();
})
