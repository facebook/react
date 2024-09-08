
## Input

```javascript
// @flow

import {useImperativeHandle, useRef} from 'react';

const a = {b: 42};
let b = 42;

component Component(prop: number) {
  const ref = useRef(null);
  useImperativeHandle(ref, () => {
    a.b = prop;
    b = prop;
    return {
      foo: () => {
        a.b = prop;
        b = prop;
      },
    };
  }, [prop]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{prop: 1}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";

import { useImperativeHandle, useRef } from "react";

const a = { b: 42 };
let b = 42;

function Component(t0) {
  const $ = _c(3);
  const { prop } = t0;
  const ref = useRef(null);
  let t1;
  let t2;
  if ($[0] !== prop) {
    t1 = () => {
      a.b = prop;
      b = prop;
      return {
        foo: () => {
          a.b = prop;
          b = prop;
        },
      };
    };

    t2 = [prop];
    $[0] = prop;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useImperativeHandle(ref, t1, t2);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ prop: 1 }],
};

```
      
### Eval output
(kind: ok) 