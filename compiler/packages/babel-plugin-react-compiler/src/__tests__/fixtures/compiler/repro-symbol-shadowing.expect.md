
## Input

```javascript
function process(a, b) {}
function Component(props) {
  const a = {};
  const b = {};
  if (props.skip) {
    return null;
  }
  process(a, b);
  return <div />;
}

function Symbol() {}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{skip: true}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function process(a, b) {}
function Component(props) {
  const $ = _c(3);
  let t0;
  if ($[0] !== props.skip) {
    t0 = globalThis.Symbol.for("react.early_return_sentinel");
    bb0: {
      const a = {};
      const b = {};
      if (props.skip) {
        t0 = null;
        break bb0;
      }

      process(a, b);
    }
    $[0] = props.skip;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  if (t0 !== globalThis.Symbol.for("react.early_return_sentinel")) {
    return t0;
  }
  let t1;
  if ($[2] === globalThis.Symbol.for("react.memo_cache_sentinel")) {
    t1 = <div />;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

function Symbol() {}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ skip: true }],
};

```
      
### Eval output
(kind: ok) null