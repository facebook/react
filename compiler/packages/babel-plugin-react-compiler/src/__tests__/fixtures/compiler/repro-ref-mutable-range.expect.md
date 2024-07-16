
## Input

```javascript
import { Stringify, identity, mutate, CONST_TRUE } from "shared-runtime";

function Foo(props, ref) {
  const value = {};
  if (CONST_TRUE) {
    mutate(value);
    return <Stringify ref={ref} />;
  }
  mutate(value);
  if (CONST_TRUE) {
    return <Stringify ref={identity(ref)} />;
  }
  return value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}, { current: "fake-ref-object" }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify, identity, mutate, CONST_TRUE } from "shared-runtime";

function Foo(props, ref) {
  const $ = _c(5);
  let value;
  let t0;
  if ($[0] !== ref) {
    t0 = Symbol.for("react.early_return_sentinel");
    bb0: {
      value = {};
      if (CONST_TRUE) {
        mutate(value);
        t0 = <Stringify ref={ref} />;
        break bb0;
      }

      mutate(value);
      if (CONST_TRUE) {
        const t1 = identity(ref);
        let t2;
        if ($[3] !== t1) {
          t2 = <Stringify ref={t1} />;
          $[3] = t1;
          $[4] = t2;
        } else {
          t2 = $[4];
        }
        t0 = t2;
        break bb0;
      }
    }
    $[0] = ref;
    $[1] = value;
    $[2] = t0;
  } else {
    value = $[1];
    t0 = $[2];
  }
  if (t0 !== Symbol.for("react.early_return_sentinel")) {
    return t0;
  }
  return value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}, { current: "fake-ref-object" }],
};

```
      
### Eval output
(kind: ok) <div>{"ref":{"current":"fake-ref-object"}}</div>