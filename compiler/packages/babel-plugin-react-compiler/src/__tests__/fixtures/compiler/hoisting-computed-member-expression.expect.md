
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
  let onClick;
  let onClick2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    onClick = function onClick() {
      return bar.baz;
    };

    onClick2 = function onClick2() {
      return bar[baz];
    };

    const baz = "baz";
    const bar = { baz: 1 };
    $[0] = onClick;
    $[1] = onClick2;
  } else {
    onClick = $[0];
    onClick2 = $[1];
  }
  let t0;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (
      <Stringify onClick={onClick} onClick2={onClick2} shouldInvokeFns={true} />
    );
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
};

```
      
### Eval output
(kind: ok) <div>{"onClick":{"kind":"Function","result":1},"onClick2":{"kind":"Function","result":1},"shouldInvokeFns":true}</div>