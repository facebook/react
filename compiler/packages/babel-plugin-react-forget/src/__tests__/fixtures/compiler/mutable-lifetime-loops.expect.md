
## Input

```javascript
function mutate(x, y) {
  "use no forget";
  if (x != null) {
    x.value = (x.value ?? 0) + 1;
  }
  if (y != null) {
    y.value = (y.value ?? 0) + 1;
  }
}
function cond(x) {
  "use no forget";
  return x.value > 5;
}

function testFunction(props) {
  let a = {};
  let b = {};
  let c = {};
  let d = {};
  while (true) {
    let z = a;
    a = b;
    b = c;
    c = d;
    d = z;
    mutate(a, b);
    if (cond(a)) {
      break;
    }
  }

  // all of these tests are seemingly readonly, since the values are never directly
  // mutated again. but they are all aliased by `d`, which is later modified, and
  // these are therefore mutable references:
  if (a) {
  }
  if (b) {
  }
  if (c) {
  }
  if (d) {
  }

  mutate(d, null);
  return { a, b, c, d };
}

export const FIXTURE_ENTRYPOINT = {
  fn: testFunction,
  params: [{}],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function mutate(x, y) {
  "use no forget";
  if (x != null) {
    x.value = (x.value ?? 0) + 1;
  }
  if (y != null) {
    y.value = (y.value ?? 0) + 1;
  }
}
function cond(x) {
  "use no forget";
  return x.value > 5;
}

function testFunction(props) {
  const $ = useMemoCache(5);
  let a;
  let b;
  let c;
  let d;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = {};
    b = {};
    c = {};
    d = {};
    while (true) {
      const z = a;
      a = b;
      b = c;
      c = d;
      d = z;
      mutate(a, b);
      if (cond(a)) {
        break;
      }
    }
    if (a) {
    }
    if (b) {
    }
    if (c) {
    }
    if (d) {
    }

    mutate(d, null);
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = d;
  } else {
    a = $[0];
    b = $[1];
    c = $[2];
    d = $[3];
  }
  let t0;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { a, b, c, d };
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: testFunction,
  params: [{}],
  isComponent: false,
};

```
      