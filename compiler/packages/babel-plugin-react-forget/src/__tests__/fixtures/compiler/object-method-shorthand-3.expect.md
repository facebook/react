
## Input

```javascript
import { mutate } from "shared-runtime";

function Component(a) {
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
  fn: Component,
  params: [{ x: 1 }],
};

```

## Code

```javascript
import { mutate } from "shared-runtime";

function Component(a) {
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
  fn: Component,
  params: [{ x: 1 }],
};

```
      
### Eval output
(kind: ok) {"a":{"x":1},"wat0":"joe"}