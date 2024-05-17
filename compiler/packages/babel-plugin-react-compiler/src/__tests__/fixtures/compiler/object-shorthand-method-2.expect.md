
## Input

```javascript
import { createHookWrapper } from "shared-runtime";

function useHook({ a, b, c }) {
  return {
    x: [a],
    y() {
      return [b];
    },
    z: { c },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ a: 1, b: 2, c: 2 }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { createHookWrapper } from "shared-runtime";

function useHook(t0) {
  const $ = _c(4);
  const { a, b, c } = t0;
  let t1;
  if ($[0] !== a) {
    let t2;
    if ($[2] !== c) {
      t2 = { c };
      $[2] = c;
      $[3] = t2;
    } else {
      t2 = $[3];
    }
    t1 = {
      x: [a],
      y() {
        return [b];
      },
      z: t2,
    };
    $[0] = a;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ a: 1, b: 2, c: 2 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"x":[1],"y":{"kind":"Function","result":[2]},"z":{"c":2}},"shouldInvokeFns":true}</div>