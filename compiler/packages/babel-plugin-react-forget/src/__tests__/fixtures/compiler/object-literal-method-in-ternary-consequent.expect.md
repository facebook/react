
## Input

```javascript
import { createHookWrapper } from "shared-runtime";

function useHook({ isCond, value }) {
  return isCond
    ? {
        getValue() {
          return value;
        },
      }
    : 42;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ isCond: true, value: 0 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { createHookWrapper } from "shared-runtime";

function useHook(t15) {
  const $ = useMemoCache(3);
  const { isCond, value } = t15;
  let t0;
  if ($[0] !== isCond || $[1] !== value) {
    t0 = isCond
      ? {
          getValue() {
            return value;
          },
        }
      : 42;
    $[0] = isCond;
    $[1] = value;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ isCond: true, value: 0 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"getValue":{"kind":"Function","result":0}},"shouldInvokeFns":true}</div>