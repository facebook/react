
## Input

```javascript
function useFoo({ obj, objIsNull }) {
  const x = [];
  b0: {
    if (objIsNull) {
      break b0;
    }
    x.push(obj.a);
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

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function useFoo(t0) {
  const $ = useMemoCache(3);
  const { obj, objIsNull } = t0;
  let x;
  if ($[0] !== objIsNull || $[1] !== obj.a) {
    x = [];
    bb1: {
      if (objIsNull) {
        break bb1;
      }

      x.push(obj.a);
    }
    $[0] = objIsNull;
    $[1] = obj.a;
    $[2] = x;
  } else {
    x = $[2];
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
      