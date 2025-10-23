
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp
import {useEffect, useState, useRef} from 'react';

export default function Component({test}) {
  const [local, setLocal] = useState('');

  const myRef = useRef(null);

  useEffect(() => {
    setLocal(myRef.current + test);
  }, [test]);

  return <>{local}</>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{test: 'testString'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp
import { useEffect, useState, useRef } from "react";

export default function Component(t0) {
  const $ = _c(5);
  const { test } = t0;
  const [local, setLocal] = useState("");

  const myRef = useRef(null);
  let t1;
  let t2;
  if ($[0] !== test) {
    t1 = () => {
      setLocal(myRef.current + test);
    };
    t2 = [test];
    $[0] = test;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useEffect(t1, t2);
  let t3;
  if ($[3] !== local) {
    t3 = <>{local}</>;
    $[3] = local;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ test: "testString" }],
};

```
      
### Eval output
(kind: ok) nulltestString