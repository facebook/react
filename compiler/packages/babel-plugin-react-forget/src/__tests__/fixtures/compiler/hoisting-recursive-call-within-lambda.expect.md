
## Input

```javascript
function Foo({}) {
  const outer = (val) => {
    const fact = (x) => {
      if (x <= 0) {
        return 1;
      }
      return x * fact(x - 1);
    };
    return fact(val);
  };
  return outer(3);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Foo(t0) {
  const $ = useMemoCache(2);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = (val) => {
      const fact = (x) => {
        if (x <= 0) {
          return 1;
        }
        return x * fact(x - 1);
      };
      return fact(val);
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const outer = t1;
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = outer(3);
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```
      
### Eval output
(kind: ok) 6