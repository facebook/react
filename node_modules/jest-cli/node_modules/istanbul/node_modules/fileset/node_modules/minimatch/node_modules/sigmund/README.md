# sigmund

Quick and dirty signatures for Objects.

This is like a much faster `deepEquals` comparison, which returns a
string key suitable for caches and the like.

## Usage

```javascript
function doSomething (someObj) {
  var key = sigmund(someObj, maxDepth) // max depth defaults to 10
  var cached = cache.get(key)
  if (cached) return cached

  var result = expensiveCalculation(someObj)
  cache.set(key, result)
  return result
}
```

The resulting key will be as unique and reproducible as calling
`JSON.stringify` or `util.inspect` on the object, but is much faster.
In order to achieve this speed, some differences are glossed over.
For example, the object `{0:'foo'}` will be treated identically to the
array `['foo']`.

Also, just as there is no way to summon the soul from the scribblings
of a cocaine-addled psychoanalyst, there is no way to revive the object
from the signature string that sigmund gives you.  In fact, it's
barely even readable.

As with `util.inspect` and `JSON.stringify`, larger objects will
produce larger signature strings.

Because sigmund is a bit less strict than the more thorough
alternatives, the strings will be shorter, and also there is a
slightly higher chance for collisions.  For example, these objects
have the same signature:

    var obj1 = {a:'b',c:/def/,g:['h','i',{j:'',k:'l'}]}
    var obj2 = {a:'b',c:'/def/',g:['h','i','{jkl']}

Like a good Freudian, sigmund is most effective when you already have
some understanding of what you're looking for.  It can help you help
yourself, but you must be willing to do some work as well.

Cycles are handled, and cyclical objects are silently omitted (though
the key is included in the signature output.)

The second argument is the maximum depth, which defaults to 10,
because that is the maximum object traversal depth covered by most
insurance carriers.
