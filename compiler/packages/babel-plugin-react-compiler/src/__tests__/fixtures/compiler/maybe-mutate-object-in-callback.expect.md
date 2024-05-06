
## Input

```javascript
const { mutate } = require("shared-runtime");

function Component(props) {
  const object = {};
  // We optimistically assume function calls within callbacks don't mutate (unless the function
  // is known to be called during render), so this should get memoized
  const onClick = () => {
    mutate(object);
  };
  return <Foo callback={onClick}>{props.children}</Foo>;
}

function Foo({ children }) {
  return children;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ children: <div>Hello</div> }],
};

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime";
const { mutate } = require("shared-runtime");

function Component(props) {
  const $ = useMemoCache(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const object = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      mutate(object);
    };
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const onClick = t1;
  let t2;
  if ($[2] !== props.children) {
    t2 = <Foo callback={onClick}>{props.children}</Foo>;
    $[2] = props.children;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

function Foo(t0) {
  const { children } = t0;
  return children;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ children: <div>Hello</div> }],
};

```
      
### Eval output
(kind: ok) <div>Hello</div>