
## Input

```javascript
import { makeObject_Primitives } from "shared-runtime";

function Component(props) {
  const object = makeObject_Primitives();
  if (props.cond) {
    object.value = 1;
    return object;
  } else {
    object.value = props.value;
    return object;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: false, value: [0, 1, 2] }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { makeObject_Primitives } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] !== props) {
    t0 = Symbol.for("react.early_return_sentinel");
    bb9: {
      const object = makeObject_Primitives();
      if (props.cond) {
        object.value = 1;
        t0 = object;
        break bb9;
      } else {
        object.value = props.value;
        t0 = object;
        break bb9;
      }
    }
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  if (t0 !== Symbol.for("react.early_return_sentinel")) {
    return t0;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: false, value: [0, 1, 2] }],
};

```
      
### Eval output
(kind: ok) {"a":0,"b":"value1","c":true,"value":[0,1,2]}