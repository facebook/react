
## Input

```javascript
function foo() {
  const a = [[1]];
  const first = a.at(0);
  first.set(0, 2);
  return a;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { c as useMemoCache } from "react";
function foo() {
  const $ = useMemoCache(1);
  let a;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [[1]];
    const first = a.at(0);
    first.set(0, 2);
    $[0] = a;
  } else {
    a = $[0];
  }
  return a;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};

```
      