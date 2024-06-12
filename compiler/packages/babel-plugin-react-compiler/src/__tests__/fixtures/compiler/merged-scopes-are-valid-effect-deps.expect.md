
## Input

```javascript
// @validateMemoizedEffectDependencies

import { useEffect } from "react";

function Component(props) {
  const y = [[props.value]]; // merged w scope for inner array

  useEffect(() => {
    console.log(y);
  }, [y]); // should still be a valid dependency here

  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateMemoizedEffectDependencies

import { useEffect } from "react";

function Component(props) {
  const $ = _c(6);
  let t0;
  if ($[0] !== props.value) {
    t0 = [[props.value]];
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const y = t0;
  let t1;
  if ($[2] !== y) {
    t1 = () => {
      console.log(y);
    };
    $[2] = y;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== y) {
    t2 = [y];
    $[4] = y;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  useEffect(t1, t2);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [[42]]
logs: [[ [ 42 ] ]]