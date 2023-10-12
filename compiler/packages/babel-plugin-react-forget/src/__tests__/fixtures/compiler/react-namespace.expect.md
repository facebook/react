
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
  const $ = useMemoCache(5);
  const foo = React.useContext(FooContext);
  const ref = React.useRef();
  const [x, setX] = React.useState(false);
  const onClick = () => {
    setX(true);
    ref.current = true;
    foo.current = true;
  };
  let t0;
  if ($[0] !== props.children) {
    t0 = React.cloneElement(props.children);
    $[0] = props.children;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== onClick || $[3] !== t0) {
    t1 = <div onClick={onClick}>{t0}</div>;
    $[2] = onClick;
    $[3] = t0;
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
      