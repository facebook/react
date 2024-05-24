
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
  const $ = _c(3);
  let bar;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function onClick2() {
      return bar[baz];
    };

    const baz = "baz";
    bar = { baz: 1 };
    $[0] = bar;
    $[1] = t0;
  } else {
    bar = $[0];
    t0 = $[1];
  }
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    const onClick = function onClick() {
      return bar.baz;
    };
    const onClick2 = t0;

    t1 = (
      <Stringify onClick={onClick} onClick2={onClick2} shouldInvokeFns={true} />
    );
    $[2] = t1;
  } else {
    t1 = $[2];
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