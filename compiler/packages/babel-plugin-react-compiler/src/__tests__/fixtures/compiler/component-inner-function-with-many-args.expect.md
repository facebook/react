
## Input

```javascript
import { Stringify } from "shared-runtime";
function Component(props) {
  const cb = (x, y, z) => x + y + z;

  return <Stringify cb={cb} id={props.id} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ id: 0 }],
};

```

## Code

```javascript
import { c as useMemoCache } from "react";
import { Stringify } from "shared-runtime";
function Component(props) {
  const $ = useMemoCache(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (x, y, z) => x + y + z;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const cb = t0;
  let t1;
  if ($[1] !== props.id) {
    t1 = <Stringify cb={cb} id={props.id} />;
    $[1] = props.id;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ id: 0 }],
};

```
      
### Eval output
(kind: ok) <div>{"cb":"[[ function params=3 ]]","id":0}</div>