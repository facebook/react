
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

export default function Component(props) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    const computed = props.prefix + props.value + props.suffix;
    setDisplayValue(computed);
  }, [props.prefix, props.value, props.suffix]);

  return <div>{displayValue}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{prefix: '[', value: 'test', suffix: ']'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects
import { useEffect, useState } from "react";

export default function Component(props) {
  const $ = _c(7);
  const [displayValue, setDisplayValue] = useState("");
  let t0;
  let t1;
  if ($[0] !== props.prefix || $[1] !== props.suffix || $[2] !== props.value) {
    t0 = () => {
      const computed = props.prefix + props.value + props.suffix;
      setDisplayValue(computed);
    };
    t1 = [props.prefix, props.value, props.suffix];
    $[0] = props.prefix;
    $[1] = props.suffix;
    $[2] = props.value;
    $[3] = t0;
    $[4] = t1;
  } else {
    t0 = $[3];
    t1 = $[4];
  }
  useEffect(t0, t1);
  let t2;
  if ($[5] !== displayValue) {
    t2 = <div>{displayValue}</div>;
    $[5] = displayValue;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ prefix: "[", value: "test", suffix: "]" }],
};

```
      
### Eval output
(kind: ok) <div>[test]</div>