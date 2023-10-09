
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
  const c_0 = $[0] !== foo.current;
  let t0;
  if (c_0) {
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
  const c_2 = $[2] !== getValue;
  let t1;
  if (c_2) {
    t1 = getValue();
    $[2] = getValue;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const value = t1;
  const c_4 = $[4] !== value;
  let t2;
  if (c_4) {
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
      