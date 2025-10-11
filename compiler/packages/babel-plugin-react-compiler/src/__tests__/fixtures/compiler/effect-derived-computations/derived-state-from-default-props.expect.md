
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

export default function Component({input = 'empty'}) {
  const [currInput, setCurrInput] = useState(input);
  const localConst = 'local const';

  useEffect(() => {
    setCurrInput(input + localConst);
  }, [input, localConst]);

  return <div>{currInput}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{input: 'test'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects
import { useEffect, useState } from "react";

export default function Component(t0) {
  const $ = _c(5);
  const { input: t1 } = t0;
  const input = t1 === undefined ? "empty" : t1;
  const [currInput, setCurrInput] = useState(input);
  let t2;
  let t3;
  if ($[0] !== input) {
    t2 = () => {
      setCurrInput(input + "local const");
    };
    t3 = [input, "local const"];
    $[0] = input;
    $[1] = t2;
    $[2] = t3;
  } else {
    t2 = $[1];
    t3 = $[2];
  }
  useEffect(t2, t3);
  let t4;
  if ($[3] !== currInput) {
    t4 = <div>{currInput}</div>;
    $[3] = currInput;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ input: "test" }],
};

```
      
### Eval output
(kind: ok) <div>testlocal const</div>