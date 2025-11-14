
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly

function Component({prop}) {
  const [s, setS] = useState(0);
  useEffect(() => {
    setS(prop);
  }, [prop, setS]);

  return <div>{prop}</div>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @loggerTestOnly

function Component(t0) {
  const $ = _c(5);
  const { prop } = t0;
  const [, setS] = useState(0);
  let t1;
  let t2;
  if ($[0] !== prop) {
    t1 = () => {
      setS(prop);
    };
    t2 = [prop, setS];
    $[0] = prop;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useEffect(t1, t2);
  let t3;
  if ($[3] !== prop) {
    t3 = <div>{prop}</div>;
    $[3] = prop;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"description":"Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user\n\nThis setState call is setting a derived value that depends on the following reactive sources:\n\nProps: [prop]\n\nData Flow Tree:\n└── prop (Prop)\n\nSee: https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state","category":"EffectDerivationsOfState","reason":"You might not need an effect. Derive values in render, not effects.","details":[{"kind":"error","loc":{"start":{"line":6,"column":4,"index":150},"end":{"line":6,"column":8,"index":154},"filename":"effect-used-in-dep-array-still-errors.ts","identifierName":"setS"},"message":"This should be computed during render, not in an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":3,"column":0,"index":64},"end":{"line":10,"column":1,"index":212},"filename":"effect-used-in-dep-array-still-errors.ts"},"fnName":"Component","memoSlots":5,"memoBlocks":2,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented