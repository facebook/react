
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly

function Component() {
  const [foo, setFoo] = useState({});
  const [bar, setBar] = useState(new Set());

  /*
   * isChanged is considered context of the effect's function expression,
   * if we don't bail out of effect mutation derivation tracking, isChanged
   * will inherit the sources of the effect's function expression.
   *
   * This is innacurate and with the multiple passes ends up causing an infinite loop.
   */
  useEffect(() => {
    let isChanged = false;

    const newData = foo.map(val => {
      bar.someMethod(val);
      isChanged = true;
    });

    if (isChanged) {
      setFoo(newData);
    }
  }, [foo, bar]);

  return (
    <div>
      {foo}, {bar}
    </div>
  );
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @loggerTestOnly

function Component() {
  const $ = _c(9);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const [foo, setFoo] = useState(t0);
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = new Set();
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const [bar] = useState(t1);
  let t2;
  let t3;
  if ($[2] !== bar || $[3] !== foo) {
    t2 = () => {
      let isChanged = false;

      const newData = foo.map((val) => {
        bar.someMethod(val);
        isChanged = true;
      });

      if (isChanged) {
        setFoo(newData);
      }
    };

    t3 = [foo, bar];
    $[2] = bar;
    $[3] = foo;
    $[4] = t2;
    $[5] = t3;
  } else {
    t2 = $[4];
    t3 = $[5];
  }
  useEffect(t2, t3);
  let t4;
  if ($[6] !== bar || $[7] !== foo) {
    t4 = (
      <div>
        {foo}, {bar}
      </div>
    );
    $[6] = bar;
    $[7] = foo;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  return t4;
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"description":"Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user\n\nThis setState call is setting a derived value that depends on the following reactive sources:\n\nState: [foo, bar]\n\nData Flow Tree:\n└── newData\n    ├── foo (State)\n    └── bar (State)\n\nSee: https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state","category":"EffectDerivationsOfState","reason":"You might not need an effect. Derive values in render, not effects.","details":[{"kind":"error","loc":{"start":{"line":23,"column":6,"index":663},"end":{"line":23,"column":12,"index":669},"filename":"function-expression-mutation-edge-case.ts","identifierName":"setFoo"},"message":"This should be computed during render, not in an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":3,"column":0,"index":64},"end":{"line":32,"column":1,"index":762},"filename":"function-expression-mutation-edge-case.ts"},"fnName":"Component","memoSlots":9,"memoBlocks":4,"memoValues":5,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented