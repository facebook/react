
## Input

```javascript
import { createHookWrapper, setProperty } from "shared-runtime";
function useHook(props) {
  const x = {
    getX() {
      return props;
    },
  };
  const y = {
    getY() {
      return "y";
    },
  };
  return setProperty(x, y);
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ value: 0 }],
};

```

## Code

```javascript
import { createHookWrapper, setProperty } from "shared-runtime";
function useHook(props) {
  const x = {
    getX() {
      return props;
    },
  };

  const y = {
    getY() {
      return "y";
    },
  };
  return setProperty(x, y);
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ value: 0 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"getX":{"kind":"Function","result":{"value":0}},"wat0":{"getY":{"kind":"Function","result":"y"}}},"shouldInvokeFns":true}</div>