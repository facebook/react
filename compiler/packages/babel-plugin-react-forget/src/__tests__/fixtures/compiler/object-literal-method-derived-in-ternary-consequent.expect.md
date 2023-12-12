
## Input

```javascript
import { identity, createHookWrapper } from "shared-runtime";

function useHook({ isCond, value }) {
  return isCond
    ? identity({
        getValue() {
          return value;
        },
      })
    : 42;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ isCond: true, value: 0 }],
};

```

## Code

```javascript
import { identity, createHookWrapper } from "shared-runtime";

function useHook(t17) {
  const { isCond, value } = t17;
  return isCond
    ? identity({
        getValue() {
          return value;
        },
      })
    : 42;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ isCond: true, value: 0 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"getValue":{"kind":"Function","result":0}},"shouldInvokeFns":true}</div>