
## Input

```javascript
// @enablePreserveExistingMemoizationGuarantees
import { useCallback } from "react";
import {
  identity,
  makeObject_Primitives,
  mutate,
  useHook,
} from "shared-runtime";

function Component(props) {
  const free = makeObject_Primitives();
  const free2 = makeObject_Primitives();
  const part = free2.part;
  useHook();
  const callback = useCallback(() => {
    const x = makeObject_Primitives();
    x.value = props.value;
    mutate(x, free, part);
  }, [props.value]);
  mutate(free, part);
  return callback;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enablePreserveExistingMemoizationGuarantees
import { useCallback } from "react";
import {
  identity,
  makeObject_Primitives,
  mutate,
  useHook,
} from "shared-runtime";

function Component(props) {
  const $ = _c(3);
  let t0;
  let t1;
  if ($[0] !== props.value) {
    const free = makeObject_Primitives();
    const free2 = makeObject_Primitives();
    const part = free2.part;

    t0 = () => {
      const x = makeObject_Primitives();
      x.value = props.value;
      mutate(x, free, part);
    };
    const callback = t0;

    t1 = callback;
    mutate(free, part);
    $[0] = props.value;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  useHook();
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      
### Eval output
(kind: ok) "[[ function params=0 ]]"