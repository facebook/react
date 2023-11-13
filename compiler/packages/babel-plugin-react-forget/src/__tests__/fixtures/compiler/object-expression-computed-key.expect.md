
## Input

```javascript
import { identity } from "shared-runtime";

const SCALE = 2;

function Component(props) {
  const { key } = props;
  const context = {
    [key]: identity([props.value, SCALE]),
  };
  return context;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ key: "Sathya", value: "Compiler" }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { identity } from "shared-runtime";

const SCALE = 2;

function Component(props) {
  const $ = useMemoCache(5);
  const { key } = props;
  let t0;
  if ($[0] !== props.value) {
    t0 = identity([props.value, SCALE]);
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== key || $[3] !== t0) {
    t1 = { [key]: t0 };
    $[2] = key;
    $[3] = t0;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const context = t1;
  return context;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ key: "Sathya", value: "Compiler" }],
};

```
      