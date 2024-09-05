
## Input

```javascript
import {identity} from 'shared-runtime';

function Component(props) {
  let [x] = props.value;
  const foo = () => {
    x = identity(props.value[0]);
  };
  foo();
  return {x};
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: [42]}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity } from "shared-runtime";

function Component(props) {
  const $ = _c(4);
  let x;
  if ($[0] !== props.value) {
    const [t0] = props.value;
    x = t0;
    const foo = () => {
      x = identity(props.value[0]);
    };

    foo();
    $[0] = props.value;
    $[1] = x;
  } else {
    x = $[1];
  }
  const t0 = x;
  let t1;
  if ($[2] !== t0) {
    t1 = { x: t0 };
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: [42] }],
};

```
      
### Eval output
(kind: ok) {"x":42}