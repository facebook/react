
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({propValue}) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    setValue(propValue);
  }, [propValue]);

  return <MockComponent setter={setValue} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{propValue: 'test'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects
import { useEffect, useState } from "react";

function Component(t0) {
  const $ = _c(4);
  const { propValue } = t0;
  const [, setValue] = useState(null);
  let t1;
  let t2;
  if ($[0] !== propValue) {
    t1 = () => {
      setValue(propValue);
    };
    t2 = [propValue];
    $[0] = propValue;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useEffect(t1, t2);
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = <MockComponent setter={setValue} />;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ propValue: "test" }],
};

```
      
### Eval output
(kind: exception) MockComponent is not defined