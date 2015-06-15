var tape = require('tape')
var genfun = require('./')

tape('generate add function', function(t) {
  var fn = genfun()
    ('function add(n) {')
      ('return n + %d', 42)
    ('}')

  t.same(fn.toString(), 'function add(n) {\n  return n + 42\n}', 'code is indented')
  t.same(fn.toFunction()(10), 52, 'function works')
  t.end()
})

tape('generate function + closed variables', function(t) {
  var fn = genfun()
    ('function add(n) {')
      ('return n + %d + number', 42)
    ('}')

  var notGood = fn.toFunction()
  var good = fn.toFunction({number:10})

  try {
    notGood(10)
    t.ok(false, 'function should not work')
  } catch (err) {
    t.same(err.message, 'number is not defined', 'throws reference error')
  }

  t.same(good(11), 63, 'function with closed var works')
  t.end()
})