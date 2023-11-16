
## Input

```javascript
import { createContext, useContext } from "react";

const FooContext = createContext({ current: true });

function Component(props) {
  const foo = useContext(FooContext);

  const getValue = () => {
    if (foo.current) {
      return {};
    } else {
      return null;
    }
  };
  const value = getValue();

  return <Child value={value} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import {
  createContext,
  useContext,
  unstable_useMemoCache as useMemoCache,
} from "react";

const FooContext = createContext({ current: true });

function Component(props) {
  const $ = useMemoCache(6);
  const foo = useContext(FooContext);
  let t0;
  if ($[0] !== foo.current) {
    t0 = () => {
      if (foo.current) {
        return {};
      } else {
        return null;
      }
    };
    $[0] = foo.current;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const getValue = t0;
  let t1;
  if ($[2] !== getValue) {
    t1 = getValue();
    $[2] = getValue;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const value = t1;
  let t2;
  if ($[4] !== value) {
    t2 = <Child value={value} />;
    $[4] = value;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: exception) Child is not defined
logs: ['The above error occurred in the <WrapperTestComponent> component:\n' +
  '\n' +
  '    at WrapperTestComponent (<project_root>/packages/sprout/dist/runner-evaluator.js:50:26)\n' +
  '\n' +
  'Consider adding an error boundary to your tree to customize error handling behavior.\n' +
  'Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.']