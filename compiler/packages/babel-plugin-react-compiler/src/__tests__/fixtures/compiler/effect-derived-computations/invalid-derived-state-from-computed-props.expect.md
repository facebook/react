
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
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
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
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

## Logs

```
{"kind":"CompileError","detail":{"options":{"description":"Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user\n\nThis setState call is setting a derived value that depends on the following reactive sources:\n\nProps: [props]\n\nData Flow Tree:\n└── computed\n    └── props (Prop)\n\nSee: https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state","category":"EffectDerivationsOfState","reason":"You might not need an effect. Derive values in render, not effects.","details":[{"kind":"error","loc":{"start":{"line":9,"column":4,"index":295},"end":{"line":9,"column":19,"index":310},"filename":"invalid-derived-state-from-computed-props.ts","identifierName":"setDisplayValue"},"message":"This should be computed during render, not in an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":15,"index":122},"end":{"line":13,"column":1,"index":409},"filename":"invalid-derived-state-from-computed-props.ts"},"fnName":"Component","memoSlots":7,"memoBlocks":2,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) <div>[test]</div>