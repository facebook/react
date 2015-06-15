var test = require('tap').test
var once = require('../once.js')

test('once', function (t) {
  var f = 0
  function fn (g) {
    t.equal(f, 0)
    f ++
    return f + g + this
  }
  fn.ownProperty = {}
  var foo = once(fn)
  t.equal(fn.ownProperty, foo.ownProperty)
  t.notOk(foo.called)
  for (var i = 0; i < 1E3; i++) {
    t.same(f, i === 0 ? 0 : 1)
    var g = foo.call(1, 1)
    t.ok(foo.called)
    t.same(g, 3)
    t.same(f, 1)
  }
  t.end()
})
