
## Input

```javascript
const FooContext = React.createContext({ current: null });

function Component(props) {
  const foo = React.useContext(FooContext);
  const ref = React.useRef();
  const [x, setX] = React.useState(false);
  const onClick = () => {
    setX(true);
    ref.current = true;
    foo.current = true;
  };
  return <div onClick={onClick}>{React.cloneElement(props.children)}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ children: <div>Hello</div> }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
const FooContext = React.createContext({ current: null });

function Component(props) {
  const $ = useMemoCache(7);
  const foo = React.useContext(FooContext);
  const ref = React.useRef();
  const [x, setX] = React.useState(false);
  const c_0 = $[0] !== foo.current;
  let t0;
  if (c_0) {
    t0 = () => {
      setX(true);
      ref.current = true;
      foo.current = true;
    };
    $[0] = foo.current;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onClick = t0;
  const c_2 = $[2] !== props.children;
  let t1;
  if (c_2) {
    t1 = React.cloneElement(props.children);
    $[2] = props.children;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const c_4 = $[4] !== onClick;
  const c_5 = $[5] !== t1;
  let t2;
  if (c_4 || c_5) {
    t2 = <div onClick={onClick}>{t1}</div>;
    $[4] = onClick;
    $[5] = t1;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ children: <div>Hello</div> }],
};

```
      