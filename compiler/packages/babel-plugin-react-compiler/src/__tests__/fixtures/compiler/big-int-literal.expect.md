
## Input

```javascript
function Test(props) {
  if (props.num % 2n === 0n) {
    return <>even</>;
  }

  return <>odd</>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Test,
  params: [{num: 1n}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Test(props) {
  const $ = _c(2);
  if (props.num % 2n === 0n) {
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <>even</>;
      $[0] = t0;
    } else {
      t0 = $[0];
    }
    return t0;
  }
  let t0;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <>odd</>;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Test,
  params: [{ num: 1n }],
};

```
      
### Eval output
(kind: ok) odd