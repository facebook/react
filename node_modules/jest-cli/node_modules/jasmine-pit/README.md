# jasmine-pit

Writing tests for promises in jasmine is kind of a pain in the ass.
jasmine-pit makes doing such things a tiny bit easier by providing an augmented
version of `it()` (called `pit()`) that allows you to simply return a promise that may eventually
assert expect()s (or propogate errors).

## Example
```js

jasminePit.install(window);

describe('MyTestSuite', functtion() {
  pit('Spec 1', function() {
    return funcThatReturnsPromise().then(function(stuff) {
      expect(stuff).toBe(stuff_i_expect_it_to_be);
    });
  });
});
```

This will execute the promise chain and, if any errors occur along the way, they
will be propogated up to jasmine and reported as normal.

Don't be afraid to take a look at the source. The definition for `pit()` is stupid
simple.
