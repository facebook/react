
## Input

```javascript
function Component(props) {
  let x;
  const object = { ...props.value };
  for (const y in object) {
    if (y === "break") {
      break;
    }
    x = object[y];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  // should return 'a'
  params: [{ a: "a", break: null, c: "C!" }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  const c_0 = $[0] !== props.value;
  let x;
  if (c_0) {
    const c_2 = $[2] !== props.value;
    let t0;
    if (c_2) {
      t0 = { ...props.value };
      $[2] = props.value;
      $[3] = t0;
    } else {
      t0 = $[3];
    }
    const object = t0;
    for (const y in object) {
      if (y === "break") {
        break;
      }

      x = object[y];
    }
    $[0] = props.value;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  // should return 'a'
  params: [{ a: "a", break: null, c: "C!" }],
};

```
      