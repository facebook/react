
## Input

```javascript
import { createContext, useContext } from "react";

const FooContext = createContext({ current: null });

function Component(props) {
  const foo = useContext(FooContext);
  // This function should be memoized since it is only reading the context value
  const onClick = () => {
    console.log(foo.current);
  };
  return <div onClick={onClick}>{props.children}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ children: <div>Hello</div> }],
};

```

## Code

```javascript
import {
  createContext,
  useContext,
  unstable_useMemoCache as useMemoCache,
} from "react";

const FooContext = createContext({ current: null });

function Component(props) {
  const $ = useMemoCache(5);
  const foo = useContext(FooContext);
  const c_0 = $[0] !== foo.current;
  let t0;
  if (c_0) {
    t0 = () => {
      console.log(foo.current);
    };
    $[0] = foo.current;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onClick = t0;
  const c_2 = $[2] !== onClick;
  const c_3 = $[3] !== props.children;
  let t1;
  if (c_2 || c_3) {
    t1 = <div onClick={onClick}>{props.children}</div>;
    $[2] = onClick;
    $[3] = props.children;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ children: <div>Hello</div> }],
};

```
      