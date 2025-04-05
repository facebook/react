
## Input

```javascript
import {Stringify, useIdentity} from 'shared-runtime';

function Component() {
  const data = useIdentity(
    new Map([
      [0, 'value0'],
      [1, 'value1'],
    ])
  );
  const items = [];
  // NOTE: `i` is a context variable because it's reassigned and also referenced
  // within a closure, the `onClick` handler of each item
  for (let i = MIN; i <= MAX; i += INCREMENT) {
    items.push(
      <Stringify key={i} onClick={() => data.get(i)} shouldInvokeFns={true} />
    );
  }
  return <>{items}</>;
}

const MIN = 0;
const MAX = 3;
const INCREMENT = 1;

export const FIXTURE_ENTRYPOINT = {
  params: [],
  fn: Component,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify, useIdentity } from "shared-runtime";

function Component() {
  const $ = _c(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = new Map([
      [0, "value0"],
      [1, "value1"],
    ]);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const data = useIdentity(t0);
  let t1;
  if ($[1] !== data) {
    const items = [];
    for (let i = MIN; i <= MAX; i = i + INCREMENT, i) {
      items.push(
        <Stringify
          key={i}
          onClick={() => data.get(i)}
          shouldInvokeFns={true}
        />,
      );
    }

    t1 = <>{items}</>;
    $[1] = data;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

const MIN = 0;
const MAX = 3;
const INCREMENT = 1;

export const FIXTURE_ENTRYPOINT = {
  params: [],
  fn: Component,
};

```
      
### Eval output
(kind: ok) <div>{"onClick":{"kind":"Function","result":"value0"},"shouldInvokeFns":true}</div><div>{"onClick":{"kind":"Function","result":"value1"},"shouldInvokeFns":true}</div><div>{"onClick":{"kind":"Function"},"shouldInvokeFns":true}</div><div>{"onClick":{"kind":"Function"},"shouldInvokeFns":true}</div>