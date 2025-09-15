
## Input

```javascript
// @validateNoSetStateInEffects @enableAllowSetStateFromRefsInEffects
import {useState, useRef, useEffect} from 'react';

function Component() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    function getBoundingRect(ref) {
      if (ref.current) {
        return ref.current.getBoundingClientRect?.()?.width ?? 100;
      }
      return 100;
    }

    setWidth(getBoundingRect(ref));
  }, []);

  return width;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoSetStateInEffects @enableAllowSetStateFromRefsInEffects
import { useState, useRef, useEffect } from "react";

function Component() {
  const $ = _c(2);
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      const getBoundingRect = function getBoundingRect(ref_0) {
        if (ref_0.current) {
          return ref_0.current.getBoundingClientRect?.()?.width ?? 100;
        }
        return 100;
      };

      setWidth(getBoundingRect(ref));
    };
    t1 = [];
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  useEffect(t0, t1);
  return width;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: ok) 100