var assert = require("assert");
var console = require("console");
var jsonpointer = require("./jsonpointer");

var obj = {
  a: 1,
  b: {
    c: 2
  },
  d: {
    e: [{a:3}, {b:4}, {c:5}]
  }
};

assert.equal(jsonpointer.get(obj, "/a"), 1);
assert.equal(jsonpointer.get(obj, "/b/c"), 2);
assert.equal(jsonpointer.get(obj, "/d/e/0/a"), 3);
assert.equal(jsonpointer.get(obj, "/d/e/1/b"), 4);
assert.equal(jsonpointer.get(obj, "/d/e/2/c"), 5);

// set returns old value
assert.equal(jsonpointer.set(obj, "/a", 2), 1);
assert.equal(jsonpointer.set(obj, "/b/c", 3), 2);
assert.equal(jsonpointer.set(obj, "/d/e/0/a", 4), 3);
assert.equal(jsonpointer.set(obj, "/d/e/1/b", 5), 4);
assert.equal(jsonpointer.set(obj, "/d/e/2/c", 6), 5);

assert.equal(jsonpointer.get(obj, "/a"), 2);
assert.equal(jsonpointer.get(obj, "/b/c"), 3);
assert.equal(jsonpointer.get(obj, "/d/e/0/a"), 4);
assert.equal(jsonpointer.get(obj, "/d/e/1/b"), 5);
assert.equal(jsonpointer.get(obj, "/d/e/2/c"), 6);

assert.equal(jsonpointer.get(obj, ""), obj);
assert.throws(function() {
  assert.equal(jsonpointer.get(obj, "a"), 3);
});

var complexKeys = {
  "a/b": {
    c: 1
  },
  d: {
    "e/f": 2
  },
  "~1": 3,
  "01": 4
}

assert.equal(jsonpointer.get(complexKeys, "/a~1b/c"), 1);
assert.equal(jsonpointer.get(complexKeys, "/d/e~1f"), 2);
assert.equal(jsonpointer.get(complexKeys, "/~01"), 3);
assert.equal(jsonpointer.get(complexKeys, "/01"), 4);
assert.throws(function() {
  assert.equal(jsonpointer.get(complexKeys, "/a/b/c"), 1);
});
assert.throws(function() {
  assert.equal(jsonpointer.get(complexKeys, "/~1"), 3);
});

// draft-ietf-appsawg-json-pointer-08 has special array rules
var ary = [ "zero", "one", "two" ];

assert.throws(function() {
  assert.equal(jsonpointer.get(ary, "/01"), "one");
});
//assert.equal(jsonpointer.set(ary, "/-", "three"), null);
//assert.equal(ary[3], "three");

// Examples from the draft:
var example = {
  "foo": ["bar", "baz"],
  "": 0,
  "a/b": 1,
  "c%d": 2,
  "e^f": 3,
  "g|h": 4,
  "i\\j": 5,
  "k\"l": 6,
  " ": 7,
  "m~n": 8
};

assert.equal(jsonpointer.get(example, ""), example);
var ans = jsonpointer.get(example, "/foo");
assert.equal(ans.length, 2);
assert.equal(ans[0], "bar");
assert.equal(ans[1], "baz");
assert.equal(jsonpointer.get(example, "/foo/0"), "bar");
assert.equal(jsonpointer.get(example, "/"), 0);
assert.equal(jsonpointer.get(example, "/a~1b"), 1);
assert.equal(jsonpointer.get(example, "/c%d"), 2);
assert.equal(jsonpointer.get(example, "/e^f"), 3);
assert.equal(jsonpointer.get(example, "/g|h"), 4);
assert.equal(jsonpointer.get(example, "/i\\j"), 5);
assert.equal(jsonpointer.get(example, "/k\"l"), 6);
assert.equal(jsonpointer.get(example, "/ "), 7);
assert.equal(jsonpointer.get(example, "/m~0n"), 8);

console.log("All tests pass.");
