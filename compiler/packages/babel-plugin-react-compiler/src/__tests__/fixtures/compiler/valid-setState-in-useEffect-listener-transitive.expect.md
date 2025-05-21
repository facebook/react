
## Input

```javascript
// @validateNoSetStateInPassiveEffects
import {useEffect, useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  useEffect(() => {
    const f = () => {
      setState();
    };
    setTimeout(() => f(), 10);
  });
  return state;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoSetStateInPassiveEffects
import { useEffect, useState } from "react";

function Component() {
  const $ = _c(1);
  const [state, setState] = useState(0);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      const f = () => {
        setState();
      };

      setTimeout(() => f(), 10);
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  useEffect(t0);
  return state;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) 0