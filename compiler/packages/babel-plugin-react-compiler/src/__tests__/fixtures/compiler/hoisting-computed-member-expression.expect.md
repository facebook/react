
## Input

```javascript
import { Stringify } from "shared-runtime";

function hoisting() {
  function onClick() {
    return bar["baz"];
  }
  function onClick2() {
    return bar[baz];
  }
  const baz = "baz";
  const bar = { baz: 1 };

  return (
    <Stringify onClick={onClick} onClick2={onClick2} shouldInvokeFns={true} />
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

function hoisting() {
  const $ = _c(4);
  let bar;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    bar = { baz: 1 };
    $[0] = bar;
  } else {
    bar = $[0];
  }
  let t0;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function onClick() {
      return bar.baz;
    };
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onClick = t0;
  let baz;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    baz = "baz";
    $[2] = baz;
  } else {
    baz = $[2];
  }
  let t1;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    const onClick2 = function onClick2() {
      return bar[baz];
    };

    t1 = (
      <Stringify onClick={onClick} onClick2={onClick2} shouldInvokeFns={true} />
    );
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
};

```
      
### Eval output
(kind: ok) <div>{"onClick":{"kind":"Function","result":1},"onClick2":{"kind":"Function","result":1},"shouldInvokeFns":true}</div>