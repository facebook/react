
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
import { c as _c } from "react/compiler-runtime";
function makeObj() {
  "use no forget";
  const result = [];
  result.a = { b: 2 };

  return result;
}

// This caused an infinite loop in the compiler
function MyApp(props) {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const y = makeObj();

    t0 = y;
    const tmp = y.a;
    const tmp2 = tmp.b;
    y.push(tmp2);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: MyApp,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [2]