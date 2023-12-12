
## Input

```javascript
import { createHookWrapper, mutate, mutateAndReturn } from "shared-runtime";
function useHook({ value }) {
  const x = mutateAndReturn({ value });
  const obj = {
    getValue() {
      return x;
    },
  };
  mutate(obj);
  return obj;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ value: 0 }],
};

```

## Code

```javascript
import { createHookWrapper, mutate, mutateAndReturn } from "shared-runtime";
function useHook(t21) {
  const { value } = t21;
  const x = mutateAndReturn({ value });
  const obj = {
    getValue() {
      return x;
    },
  };

  mutate(obj);
  return obj;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ value: 0 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"getValue":{"kind":"Function","result":{"value":0,"wat0":"joe"}},"wat0":"joe"},"shouldInvokeFns":true}</div>