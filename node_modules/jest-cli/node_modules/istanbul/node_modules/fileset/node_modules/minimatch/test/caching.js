var Minimatch = require("../minimatch.js").Minimatch
var tap = require("tap")
tap.test("cache test", function (t) {
  var mm1 = new Minimatch("a?b")
  var mm2 = new Minimatch("a?b")
  t.equal(mm1, mm2, "should get the same object")
  // the lru should drop it after 100 entries
  for (var i = 0; i < 100; i ++) {
    new Minimatch("a"+i)
  }
  mm2 = new Minimatch("a?b")
  t.notEqual(mm1, mm2, "cache should have dropped")
  t.end()
})
