
## Input

```javascript
import { createHookWrapper, mutate } from "shared-runtime";

function useHook(a) {
  const x = { a };
  let obj = {
    method() {
      mutate(x);
      return x;
    },
  };
  return obj.method();
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ x: 1 }],
};

```

## Code

```javascript
import { createHookWrapper, mutate } from "shared-runtime";

function useHook(a) {
  const x = { a };
  const obj = {
    method() {
      mutate(x);
      return x;
    },
  };
  return obj.method();
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ x: 1 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"a":{"x":1},"wat0":"joe"},"shouldInvokeFns":true}</div>