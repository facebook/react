
## Input

```javascript
// Regression test: when a function is named `$`, the compiler should not
// use `$` as the name for its synthesized memo cache variable — that would
// shadow the function name. The memo cache should be renamed to $0 (or similar).
// See https://github.com/facebook/react/issues/36167

function $(n: number) {
  return n * 2;
}

function Component({x}: {x: number}) {
  return <div>{$(x)}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{x: 5}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // Regression test: when a function is named `$`, the compiler should not
// use `$` as the name for its synthesized memo cache variable — that would
// shadow the function name. The memo cache should be renamed to $0 (or similar).
// See https://github.com/facebook/react/issues/36167

function $(n) {
  return n * 2;
}

function Component(t0) {
  const $0 = _c(4);
  const { x } = t0;
  let t1;
  if ($0[0] !== x) {
    t1 = $(x);
    $0[0] = x;
    $0[1] = t1;
  } else {
    t1 = $0[1];
  }
  let t2;
  if ($0[2] !== t1) {
    t2 = <div>{t1}</div>;
    $0[2] = t1;
    $0[3] = t2;
  } else {
    t2 = $0[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 5 }],
};

```
      
### Eval output
(kind: ok) <div>10</div>