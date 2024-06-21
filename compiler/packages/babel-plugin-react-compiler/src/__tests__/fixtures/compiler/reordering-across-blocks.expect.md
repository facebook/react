
## Input

```javascript
import { Stringify } from "shared-runtime";

function Component({ config }) {
  const object = useMemo(() => {
    const a = (event) => {
      config?.onA?.(event);
    };

    const b = (event) => {
      config?.onB?.(event);
    };

    return {
      b,
      a,
    };
  }, [config]);

  return <Stringify value={object} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

function Component(t0) {
  const $ = _c(9);
  const { config } = t0;
  let t1;
  let t2;
  if ($[0] !== config) {
    t2 = (event) => {
      config?.onA?.(event);
    };
    $[0] = config;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const a = t2;
  let t3;
  if ($[2] !== config) {
    t3 = (event_0) => {
      config?.onB?.(event_0);
    };
    $[2] = config;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const b = t3;
  let t4;
  if ($[4] !== b || $[5] !== a) {
    t4 = { b, a };
    $[4] = b;
    $[5] = a;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  t1 = t4;
  const object = t1;
  let t5;
  if ($[7] !== object) {
    t5 = <Stringify value={object} />;
    $[7] = object;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  return t5;
}

```
      
### Eval output
(kind: exception) Fixture not implemented