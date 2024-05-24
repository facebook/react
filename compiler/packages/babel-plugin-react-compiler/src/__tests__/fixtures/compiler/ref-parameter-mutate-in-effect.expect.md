
## Input

```javascript
import { useEffect } from "react";

function Foo(props, ref) {
  useEffect(() => {
    ref.current = 2;
  }, []);
  return <div>{props.bar}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ bar: "foo" }, { ref: { cuurrent: 1 } }],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useEffect } from "react";

function Foo(props, ref) {
  const $ = _c(4);
  let t0;
  if ($[0] !== props.bar) {
    t0 = <div>{props.bar}</div>;
    $[0] = props.bar;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      ref.current = 2;
    };
    t2 = [];
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ bar: "foo" }, { ref: { cuurrent: 1 } }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>foo</div>