
## Input

```javascript
function Component(props) {
  let x;
  const object = { ...props.value };
  for (const y in object) {
    if (y === "continue") {
      continue;
    }
    x = object[y];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: { a: "a", continue: "skip", b: "b!" } }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const c_1 = $[1] !== props.value;
    let t0;
    if (c_1) {
      t0 = { ...props.value };
      $[1] = props.value;
      $[2] = t0;
    } else {
      t0 = $[2];
    }
    const object = t0;
    for (const y in object) {
      if (y === "continue") {
        continue;
      }

      x = object[y];
    }
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: { a: "a", continue: "skip", b: "b!" } }],
};

```
      