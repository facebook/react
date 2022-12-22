
## Input

```javascript
function mutate(x, y) {}

function Component(props) {
  const a = {};
  const b = [a]; // array elements alias
  const c = {};
  const d = { c }; // object values alias

  // capture all the values into this object
  const x = {};
  x.b = b;
  const y = mutate(x, d); // mutation aliases the arg and return value

  // all of these tests are seemingly readonly, since the values are never directly
  // mutated again. but they are all aliased by `x`, which is later modified, and
  // these are therefore mutable references:
  if (a) {
  }
  if (b) {
  }
  if (c) {
  }
  if (d) {
  }
  if (y) {
  }

  // could in theory mutate any of a/b/c/x/z, so the above should be inferred as mutable
  mutate(x, null);
}

```

## Code

```javascript
function mutate(x, y) {}

```
## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  let a;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = {};
    $[0] = a;
  } else {
    a = $[0];
  }

  const c_1 = $[1] !== a;
  let b;

  if (c_1) {
    b = [a];
    $[1] = a;
    $[2] = b;
  } else {
    b = $[2];
  }

  const c = {};
  const d = {
    c: c,
  };
  const x = {};
  x.b = b;
  const y = mutate(x, d);

  if (a) {
  }

  if (b) {
  }

  if (c) {
  }

  if (d) {
  }

  if (y) {
  }

  mutate(x, null);
}

```
      