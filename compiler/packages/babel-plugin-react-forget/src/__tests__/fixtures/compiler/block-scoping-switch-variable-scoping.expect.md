
## Input

```javascript
import { useMemo } from "react";

function Component(props) {
  const outerHandlers = useMemo(() => {
    let handlers = { value: props.value };
    switch (props.test) {
      case true: {
        console.log(handlers.value);
        break;
      }
      default: {
      }
    }
    return handlers;
  });
  return outerHandlers;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ test: true, value: "hello" }],
};

```

## Code

```javascript
import { useMemo, unstable_useMemoCache as useMemoCache } from "react";

function Component(props) {
  const $ = useMemoCache(2);
  let t22;
  bb2: {
    let t0;
    if ($[0] !== props.value) {
      t0 = { value: props.value };
      $[0] = props.value;
      $[1] = t0;
    } else {
      t0 = $[1];
    }
    const handlers = t0;
    switch (props.test) {
      case true: {
        console.log(handlers.value);
        break bb2;
      }
      default: {
      }
    }
  }

  t22 = handlers;
  const outerHandlers = t22;
  return outerHandlers;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ test: true, value: "hello" }],
};

```
      
### Eval output
(kind: exception) handlers.foo is not a function
logs: ['The above error occurred in the <WrapperTestComponent> component:\n' +
  '\n' +
  '    at WrapperTestComponent (<project_root>/packages/sprout/dist/runner-evaluator.js:55:26)\n' +
  '\n' +
  'Consider adding an error boundary to your tree to customize error handling behavior.\n' +
  'Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.']