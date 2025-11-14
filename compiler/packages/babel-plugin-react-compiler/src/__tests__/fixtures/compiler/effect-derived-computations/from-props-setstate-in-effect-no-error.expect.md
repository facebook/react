
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @enableTreatSetIdentifiersAsStateSetters @loggerTestOnly

function Component({setParentState, prop}) {
  useEffect(() => {
    setParentState(prop);
  }, [prop]);

  return <div>{prop}</div>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @enableTreatSetIdentifiersAsStateSetters @loggerTestOnly

function Component(t0) {
  const $ = _c(7);
  const { setParentState, prop } = t0;
  let t1;
  if ($[0] !== prop || $[1] !== setParentState) {
    t1 = () => {
      setParentState(prop);
    };
    $[0] = prop;
    $[1] = setParentState;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== prop) {
    t2 = [prop];
    $[3] = prop;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  useEffect(t1, t2);
  let t3;
  if ($[5] !== prop) {
    t3 = <div>{prop}</div>;
    $[5] = prop;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

```

## Logs

```
{"kind":"CompileSuccess","fnLoc":{"start":{"line":3,"column":0,"index":105},"end":{"line":9,"column":1,"index":240},"filename":"from-props-setstate-in-effect-no-error.ts"},"fnName":"Component","memoSlots":7,"memoBlocks":3,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented