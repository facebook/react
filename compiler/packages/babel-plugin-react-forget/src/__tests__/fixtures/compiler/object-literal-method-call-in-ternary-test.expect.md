
## Input

```javascript
import {
  createHookWrapper,
  identity,
  CONST_STRING0,
  CONST_STRING1,
} from "shared-runtime";

function useHook({ value }) {
  return {
    getValue() {
      return identity(value);
    },
  }.getValue()
    ? CONST_STRING0
    : CONST_STRING1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ value: 0 }],
};

```

## Code

```javascript
import {
  createHookWrapper,
  identity,
  CONST_STRING0,
  CONST_STRING1,
} from "shared-runtime";

function useHook(t18) {
  const { value } = t18;
  return {
    getValue() {
      return identity(value);
    },
  }.getValue()
    ? CONST_STRING0
    : CONST_STRING1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ value: 0 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":"global string 1","shouldInvokeFns":true}</div>