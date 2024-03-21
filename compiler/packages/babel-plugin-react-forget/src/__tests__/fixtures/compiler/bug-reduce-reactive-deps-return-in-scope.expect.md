
## Input

```javascript
function useFoo({ obj, objIsNull }) {
  const x = [];
  if (objIsNull) {
    return;
  }
  x.push(obj.b);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ obj: null, objIsNull: true }],
  sequentialRenders: [
    { obj: null, objIsNull: true },
    { obj: { a: 2 }, objIsNull: false },
  ],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function useFoo(t0) {
  const $ = useMemoCache(4);
  const { obj, objIsNull } = t0;
  let x;
  let t1;
  if ($[0] !== objIsNull || $[1] !== obj.b) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb7: {
      x = [];
      if (objIsNull) {
        t1 = undefined;
        break bb7;
      }

      x.push(obj.b);
    }
    $[0] = objIsNull;
    $[1] = obj.b;
    $[2] = x;
    $[3] = t1;
  } else {
    x = $[2];
    t1 = $[3];
  }
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    return t1;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ obj: null, objIsNull: true }],
  sequentialRenders: [
    { obj: null, objIsNull: true },
    { obj: { a: 2 }, objIsNull: false },
  ],
};

```
      