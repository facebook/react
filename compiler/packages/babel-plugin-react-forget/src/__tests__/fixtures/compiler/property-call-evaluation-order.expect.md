
## Input

```javascript
// Should print A, arg, original

function Component() {
  const changeF = (o) => {
    o.f = () => console.log("new");
  };
  const x = {
    f: () => console.log("original"),
  };

  (console.log("A"), x).f((changeF(x), console.log("arg"), 1));
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // Should print A, arg, original

function Component() {
  const $ = useMemoCache(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (o) => {
      o.f = () => console.log("new");
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const changeF = t0;
  let t1;
  let x;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => console.log("original");
    x = { f: t1 };

    (console.log("A"), x).f((changeF(x), console.log("arg"), 1));
    $[1] = t1;
    $[2] = x;
  } else {
    t1 = $[1];
    x = $[2];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: false,
};

```
      