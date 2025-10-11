
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({propValue}) {
  const [value, setValue] = useState(null);

  function localFunction() {
    console.log('local function');
  }

  useEffect(() => {
    setValue(propValue);
    localFunction();
  }, [propValue]);

  return <div>{value}</div>;
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
  const $ = _c(6);
  const { propValue } = t0;
  const [value, setValue] = useState(null);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = function localFunction() {
      console.log("local function");
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const localFunction = t1;
  let t2;
  let t3;
  if ($[1] !== propValue) {
    t2 = () => {
      setValue(propValue);
      localFunction();
    };
    t3 = [propValue];
    $[1] = propValue;
    $[2] = t2;
    $[3] = t3;
  } else {
    t2 = $[2];
    t3 = $[3];
  }
  useEffect(t2, t3);
  let t4;
  if ($[4] !== value) {
    t4 = <div>{value}</div>;
    $[4] = value;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ propValue: "test" }],
};

```
      
### Eval output
(kind: ok) <div>test</div>
logs: ['local function']