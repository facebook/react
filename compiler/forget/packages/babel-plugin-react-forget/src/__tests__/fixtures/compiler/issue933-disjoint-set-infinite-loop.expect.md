
## Input

```javascript
function makeObj() {
  "use no forget";
  const result = [];
  result.a = { b: 2 };

  return result;
}

// This caused an infinite loop in the compiler
function MyApp(props) {
  const y = makeObj();
  const tmp = y.a;
  const tmp2 = tmp.b;
  y.push(tmp2);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: MyApp,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function makeObj() {
  "use no forget";
  const result = [];
  result.a = { b: 2 };

  return result;
}

// This caused an infinite loop in the compiler
function MyApp(props) {
  const $ = useMemoCache(1);
  let y;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    y = makeObj();
    const tmp = y.a;
    const tmp2 = tmp.b;
    y.push(tmp2);
    $[0] = y;
  } else {
    y = $[0];
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: MyApp,
  params: [],
  isComponent: false,
};

```
      