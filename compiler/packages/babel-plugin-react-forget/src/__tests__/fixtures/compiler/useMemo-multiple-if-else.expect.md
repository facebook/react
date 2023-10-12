
## Input

```javascript
import { useMemo } from "react";

function Component(props) {
  const x = useMemo(() => {
    let y = [];
    if (props.cond) {
      y.push(props.a);
    }
    if (props.cond2) {
      return y;
    }
    y.push(props.b);
    return y;
  });
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 2, cond2: false }],
};

```

## Code

```javascript
import { useMemo, unstable_useMemoCache as useMemoCache } from "react";

function Component(props) {
  const $ = useMemoCache(3);
  let t68;
  bb10: {
    let y;
    if ($[0] !== props) {
      y = [];
      if (props.cond) {
        y.push(props.a);
      }
      if (props.cond2) {
        t68 = y;
        break bb10;
      }

      y.push(props.b);
      $[0] = props;
      $[1] = y;
      $[2] = t68;
    } else {
      y = $[1];
      t68 = $[2];
    }
    t68 = y;
  }
  const x = t68;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 2, cond2: false }],
};

```
      