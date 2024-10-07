
## Input

```javascript
import {identity} from 'shared-runtime';

function Component(props) {
  let x;
  // Reassign `x` based on a reactive value, but inside a function expression
  // to make it a context variable
  const f = () => {
    if (props.cond) {
      x = 1;
    } else {
      x = 2;
    }
  };
  // Pass `f` through a function to prevent IIFE inlining optimizations
  const f2 = identity(f);
  f2();

  // The values assigned to `x` are non-reactive, but the value of `x`
  // depends on the "control" value `props.cond` which is reactive.
  // Therefore x should be treated as reactive too.
  return [x];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  sequentialRenders: [
    {cond: true},
    {cond: true},
    {cond: false},
    {cond: false},
    {cond: true},
    {cond: false},
    {cond: true},
    {cond: false},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity } from "shared-runtime";

function Component(props) {
  const $ = _c(4);
  let x;
  if ($[0] !== props.cond) {
    const f = () => {
      if (props.cond) {
        x = 1;
      } else {
        x = 2;
      }
    };

    const f2 = identity(f);
    f2();
    $[0] = props.cond;
    $[1] = x;
  } else {
    x = $[1];
  }

  const t0 = x;
  let t1;
  if ($[2] !== t0) {
    t1 = [t0];
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  sequentialRenders: [
    { cond: true },
    { cond: true },
    { cond: false },
    { cond: false },
    { cond: true },
    { cond: false },
    { cond: true },
    { cond: false },
  ],
};

```
      
### Eval output
(kind: ok) [1]
[1]
[2]
[2]
[1]
[2]
[1]
[2]