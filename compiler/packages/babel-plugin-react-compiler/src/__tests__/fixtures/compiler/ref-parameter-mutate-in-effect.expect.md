
## Input

```javascript
import {useEffect} from 'react';

function Foo(props, ref) {
  useEffect(() => {
    ref.current = 2;
  }, []);
  return <div>{props.bar}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{bar: 'foo'}, {ref: {cuurrent: 1}}],
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
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      ref.current = 2;
    };
    t1 = [];
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  useEffect(t0, t1);
  let t2;
  if ($[2] !== props.bar) {
    t2 = <div>{props.bar}</div>;
    $[2] = props.bar;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ bar: "foo" }, { ref: { cuurrent: 1 } }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>foo</div>