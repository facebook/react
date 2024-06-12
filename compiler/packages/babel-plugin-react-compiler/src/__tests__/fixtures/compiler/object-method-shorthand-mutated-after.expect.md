
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
import { c as _c } from "react/compiler-runtime";
import { createHookWrapper, mutate, mutateAndReturn } from "shared-runtime";
function useHook(t0) {
  const $ = _c(2);
  const { value } = t0;
  let t1;
  if ($[0] !== value) {
    const x = mutateAndReturn({ value });
    const obj = {
      getValue() {
        return x;
      },
    };

    t1 = obj;
    mutate(obj);
    $[0] = value;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ value: 0 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"getValue":{"kind":"Function","result":{"value":0,"wat0":"joe"}},"wat0":"joe"},"shouldInvokeFns":true}</div>