
## Input

```javascript
// @validateNoDerivedComputationsInEffects

import { useEffect, useState } from 'react';

function Component({shouldChange}) {

  const [count, setCount] = useState(0);

  useEffect(() => {
    if (shouldChange) {
      setCount(count + 1);
    }
  }, [count]);

  return (<div>{count}</div>)
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects

import { useEffect, useState } from "react";

function Component(t0) {
  const $ = _c(7);
  const { shouldChange } = t0;

  const [count, setCount] = useState(0);
  let t1;
  if ($[0] !== count || $[1] !== shouldChange) {
    t1 = () => {
      if (shouldChange) {
        setCount(count + 1);
      }
    };
    $[0] = count;
    $[1] = shouldChange;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== count) {
    t2 = [count];
    $[3] = count;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  useEffect(t1, t2);
  let t3;
  if ($[5] !== count) {
    t3 = <div>{count}</div>;
    $[5] = count;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

```
      
### Eval output
(kind: exception) Fixture not implemented