
## Input

```javascript
function Component(props) {
  'use memo';
  let x = [props.foo];
  return <div x={x}>"foo"</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{foo: 1}],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  "use memo";
  const $ = _c(4);
  let t0;
  if ($[0] !== props.foo) {
    t0 = [props.foo];
    $[0] = props.foo;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  let t1;
  if ($[2] !== x) {
    t1 = <div x={x}>"foo"</div>;
    $[2] = x;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ foo: 1 }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div x="1">"foo"</div>