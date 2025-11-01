
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import {useEffect, useState} from 'react';

function MockComponent({onSet}) {
  return <div onClick={() => onSet('clicked')}>Mock Component</div>;
}

function Component({propValue}) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    setValue(propValue);
  }, [propValue]);

  return <MockComponent onSet={setValue} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{propValue: 'test'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import { useEffect, useState } from "react";

function MockComponent(t0) {
  const $ = _c(2);
  const { onSet } = t0;
  let t1;
  if ($[0] !== onSet) {
    t1 = <div onClick={() => onSet("clicked")}>Mock Component</div>;
    $[0] = onSet;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

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
    t3 = <MockComponent onSet={setValue} />;
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

## Logs

```
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":107},"end":{"line":6,"column":1,"index":211},"filename":"derived-state-from-prop-setter-used-outside-effect-no-error.ts"},"fnName":"MockComponent","memoSlots":2,"memoBlocks":1,"memoValues":1,"prunedMemoBlocks":0,"prunedMemoValues":0}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":8,"column":0,"index":213},"end":{"line":15,"column":1,"index":402},"filename":"derived-state-from-prop-setter-used-outside-effect-no-error.ts"},"fnName":"Component","memoSlots":4,"memoBlocks":2,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) <div>Mock Component</div>