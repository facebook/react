var test = require("tap").test
  , LRU = require("../")

test("basic", function (t) {
  var cache = new LRU({max: 10})
  cache.set("key", "value")
  t.equal(cache.get("key"), "value")
  t.equal(cache.get("nada"), undefined)
  t.equal(cache.length, 1)
  t.equal(cache.max, 10)
  t.end()
})

test("least recently set", function (t) {
  var cache = new LRU(2)
  cache.set("a", "A")
  cache.set("b", "B")
  cache.set("c", "C")
  t.equal(cache.get("c"), "C")
  t.equal(cache.get("b"), "B")
  t.equal(cache.get("a"), undefined)
  t.end()
})

test("lru recently gotten", function (t) {
  var cache = new LRU(2)
  cache.set("a", "A")
  cache.set("b", "B")
  cache.get("a")
  cache.set("c", "C")
  t.equal(cache.get("c"), "C")
  t.equal(cache.get("b"), undefined)
  t.equal(cache.get("a"), "A")
  t.end()
})

test("del", function (t) {
  var cache = new LRU(2)
  cache.set("a", "A")
  cache.del("a")
  t.equal(cache.get("a"), undefined)
  t.end()
})

test("max", function (t) {
  var cache = new LRU(3)

  // test changing the max, verify that the LRU items get dropped.
  cache.max = 100
  for (var i = 0; i < 100; i ++) cache.set(i, i)
  t.equal(cache.length, 100)
  for (var i = 0; i < 100; i ++) {
    t.equal(cache.get(i), i)
  }
  cache.max = 3
  t.equal(cache.length, 3)
  for (var i = 0; i < 97; i ++) {
    t.equal(cache.get(i), undefined)
  }
  for (var i = 98; i < 100; i ++) {
    t.equal(cache.get(i), i)
  }

  // now remove the max restriction, and try again.
  cache.max = "hello"
  for (var i = 0; i < 100; i ++) cache.set(i, i)
  t.equal(cache.length, 100)
  for (var i = 0; i < 100; i ++) {
    t.equal(cache.get(i), i)
  }
  // should trigger an immediate resize
  cache.max = 3
  t.equal(cache.length, 3)
  for (var i = 0; i < 97; i ++) {
    t.equal(cache.get(i), undefined)
  }
  for (var i = 98; i < 100; i ++) {
    t.equal(cache.get(i), i)
  }
  t.end()
})

test("reset", function (t) {
  var cache = new LRU(10)
  cache.set("a", "A")
  cache.set("b", "B")
  cache.reset()
  t.equal(cache.length, 0)
  t.equal(cache.max, 10)
  t.equal(cache.get("a"), undefined)
  t.equal(cache.get("b"), undefined)
  t.end()
})


// Note: `<cache>.dump()` is a debugging tool only. No guarantees are made
// about the format/layout of the response.
test("dump", function (t) {
  var cache = new LRU(10)
  var d = cache.dump();
  t.equal(Object.keys(d).length, 0, "nothing in dump for empty cache")
  cache.set("a", "A")
  var d = cache.dump()  // { a: { key: "a", value: "A", lu: 0 } }
  t.ok(d.a)
  t.equal(d.a.key, "a")
  t.equal(d.a.value, "A")
  t.equal(d.a.lu, 0)

  cache.set("b", "B")
  cache.get("b")
  d = cache.dump()
  t.ok(d.b)
  t.equal(d.b.key, "b")
  t.equal(d.b.value, "B")
  t.equal(d.b.lu, 2)

  t.end()
})


test("basic with weighed length", function (t) {
  var cache = new LRU({
    max: 100,
    length: function (item) { return item.size }
  })
  cache.set("key", {val: "value", size: 50})
  t.equal(cache.get("key").val, "value")
  t.equal(cache.get("nada"), undefined)
  t.equal(cache.lengthCalculator(cache.get("key")), 50)
  t.equal(cache.length, 50)
  t.equal(cache.max, 100)
  t.end()
})


test("weighed length item too large", function (t) {
  var cache = new LRU({
    max: 10,
    length: function (item) { return item.size }
  })
  t.equal(cache.max, 10)

  // should fall out immediately
  cache.set("key", {val: "value", size: 50})

  t.equal(cache.length, 0)
  t.equal(cache.get("key"), undefined)
  t.end()
})

test("least recently set with weighed length", function (t) {
  var cache = new LRU({
    max:8,
    length: function (item) { return item.length }
  })
  cache.set("a", "A")
  cache.set("b", "BB")
  cache.set("c", "CCC")
  cache.set("d", "DDDD")
  t.equal(cache.get("d"), "DDDD")
  t.equal(cache.get("c"), "CCC")
  t.equal(cache.get("b"), undefined)
  t.equal(cache.get("a"), undefined)
  t.end()
})

test("lru recently gotten with weighed length", function (t) {
  var cache = new LRU({
    max: 8,
    length: function (item) { return item.length }
  })
  cache.set("a", "A")
  cache.set("b", "BB")
  cache.set("c", "CCC")
  cache.get("a")
  cache.get("b")
  cache.set("d", "DDDD")
  t.equal(cache.get("c"), undefined)
  t.equal(cache.get("d"), "DDDD")
  t.equal(cache.get("b"), "BB")
  t.equal(cache.get("a"), "A")
  t.end()
})

test("set returns proper booleans", function(t) {
  var cache = new LRU({
    max: 5,
    length: function (item) { return item.length }
  })

  t.equal(cache.set("a", "A"), true)

  // should return false for max exceeded
  t.equal(cache.set("b", "donuts"), false)

  t.equal(cache.set("b", "B"), true)
  t.equal(cache.set("c", "CCCC"), true)
  t.end()
})

test("drop the old items", function(t) {
  var cache = new LRU({
    max: 5,
    maxAge: 50
  })

  cache.set("a", "A")

  setTimeout(function () {
    cache.set("b", "b")
    t.equal(cache.get("a"), "A")
  }, 25)

  setTimeout(function () {
    cache.set("c", "C")
    // timed out
    t.notOk(cache.get("a"))
  }, 60 + 25)

  setTimeout(function () {
    t.notOk(cache.get("b"))
    t.equal(cache.get("c"), "C")
  }, 90)

  setTimeout(function () {
    t.notOk(cache.get("c"))
    t.end()
  }, 155)
})

test("individual item can have it's own maxAge", function(t) {
  var cache = new LRU({
    max: 5,
    maxAge: 50
  })

  cache.set("a", "A", 20)
  setTimeout(function () {
    t.notOk(cache.get("a"))
    t.end()
  }, 25)
})

test("individual item can have it's own maxAge > cache's", function(t) {
  var cache = new LRU({
    max: 5,
    maxAge: 20
  })

  cache.set("a", "A", 50)
  setTimeout(function () {
    t.equal(cache.get("a"), "A")
    t.end()
  }, 25)
})

test("disposal function", function(t) {
  var disposed = false
  var cache = new LRU({
    max: 1,
    dispose: function (k, n) {
      disposed = n
    }
  })

  cache.set(1, 1)
  cache.set(2, 2)
  t.equal(disposed, 1)
  cache.set(3, 3)
  t.equal(disposed, 2)
  cache.reset()
  t.equal(disposed, 3)
  t.end()
})

test("disposal function on too big of item", function(t) {
  var disposed = false
  var cache = new LRU({
    max: 1,
    length: function (k) {
      return k.length
    },
    dispose: function (k, n) {
      disposed = n
    }
  })
  var obj = [ 1, 2 ]

  t.equal(disposed, false)
  cache.set("obj", obj)
  t.equal(disposed, obj)
  t.end()
})

test("has()", function(t) {
  var cache = new LRU({
    max: 1,
    maxAge: 10
  })

  cache.set('foo', 'bar')
  t.equal(cache.has('foo'), true)
  cache.set('blu', 'baz')
  t.equal(cache.has('foo'), false)
  t.equal(cache.has('blu'), true)
  setTimeout(function() {
    t.equal(cache.has('blu'), false)
    t.end()
  }, 15)
})

test("stale", function(t) {
  var cache = new LRU({
    maxAge: 10,
    stale: true
  })

  cache.set('foo', 'bar')
  t.equal(cache.get('foo'), 'bar')
  t.equal(cache.has('foo'), true)
  setTimeout(function() {
    t.equal(cache.has('foo'), false)
    t.equal(cache.get('foo'), 'bar')
    t.equal(cache.get('foo'), undefined)
    t.end()
  }, 15)
})

test("lru update via set", function(t) {
  var cache = LRU({ max: 2 });

  cache.set('foo', 1);
  cache.set('bar', 2);
  cache.del('bar');
  cache.set('baz', 3);
  cache.set('qux', 4);

  t.equal(cache.get('foo'), undefined)
  t.equal(cache.get('bar'), undefined)
  t.equal(cache.get('baz'), 3)
  t.equal(cache.get('qux'), 4)
  t.end()
})

test("least recently set w/ peek", function (t) {
  var cache = new LRU(2)
  cache.set("a", "A")
  cache.set("b", "B")
  t.equal(cache.peek("a"), "A")
  cache.set("c", "C")
  t.equal(cache.get("c"), "C")
  t.equal(cache.get("b"), "B")
  t.equal(cache.get("a"), undefined)
  t.end()
})

test("pop the least used item", function (t) {
  var cache = new LRU(3)
  , last

  cache.set("a", "A")
  cache.set("b", "B")
  cache.set("c", "C")

  t.equal(cache.length, 3)
  t.equal(cache.max, 3)

  // Ensure we pop a, c, b
  cache.get("b", "B")

  last = cache.pop()
  t.equal(last.key, "a")
  t.equal(last.value, "A")
  t.equal(cache.length, 2)
  t.equal(cache.max, 3)

  last = cache.pop()
  t.equal(last.key, "c")
  t.equal(last.value, "C")
  t.equal(cache.length, 1)
  t.equal(cache.max, 3)

  last = cache.pop()
  t.equal(last.key, "b")
  t.equal(last.value, "B")
  t.equal(cache.length, 0)
  t.equal(cache.max, 3)

  last = cache.pop()
  t.equal(last, null)
  t.equal(cache.length, 0)
  t.equal(cache.max, 3)

  t.end()
})
