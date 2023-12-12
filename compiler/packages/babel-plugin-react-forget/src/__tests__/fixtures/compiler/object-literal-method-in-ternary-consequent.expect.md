
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
import { createHookWrapper } from "shared-runtime";

function useHook(t15) {
  const { isCond, value } = t15;
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
      
### Eval output
(kind: ok) <div>{"result":{"getValue":{"kind":"Function","result":0}},"shouldInvokeFns":true}</div>