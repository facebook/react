
## Input

```javascript
import {useRef} from 'react';

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses an impure value during render.
 */
function Component() {
  const ref = useRef(null);
  const object = {};
  object.foo = () => ref.current;
  const refValue = object.foo();
  return <div>{refValue}</div>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useRef } from "react";

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses an impure value during render.
 */
function Component() {
  const $ = _c(2);
  const ref = useRef(null);
  const object = {};
  object.foo = () => ref.current;
  const refValue = object.foo();
  let t0;
  if ($[0] !== refValue) {
    t0 = <div>{refValue}</div>;
    $[0] = refValue;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented