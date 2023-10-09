
## Input

```javascript
import * as React from "react";
import { useContext } from "react";
import { mutate } from "shared-runtime";

const FooContext = React.createContext({ current: null });

function Component(props) {
  const Foo = useContext(FooContext);
  // This callback can be memoized because we aren't 100% positive that
  // `mutate()` actually mutates, so we optimistically assume it doesn't
  // Its range doesn't get entagled w the useContext call so we're able
  // to create a reactive scope and memoize it.
  const onClick = () => {
    mutate(Foo.current);
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
import * as React from "react";
import { useContext, unstable_useMemoCache as useMemoCache } from "react";
import { mutate } from "shared-runtime";

const FooContext = React.createContext({ current: null });

function Component(props) {
  const $ = useMemoCache(5);
  const Foo = useContext(FooContext);
  const c_0 = $[0] !== Foo.current;
  let t0;
  if (c_0) {
    t0 = () => {
      mutate(Foo.current);
    };
    $[0] = Foo.current;
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
      