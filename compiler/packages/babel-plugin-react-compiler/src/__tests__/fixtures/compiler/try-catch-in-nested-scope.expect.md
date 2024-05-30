
## Input

```javascript
import { mutate, setProperty, throwErrorWithMessageIf } from "shared-runtime";

function useFoo({ value, cond }) {
  let y = [value];
  let x = { cond };

  try {
    mutate(x);
    throwErrorWithMessageIf(x.cond, "error");
  } catch {
    setProperty(x, "henderson");
    return x;
  }
  setProperty(x, "nevada");
  y.push(x);

  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ value: 4, cond: true }],
  sequentialRenders: [
    { value: 4, cond: true },
    { value: 5, cond: true },
    { value: 5, cond: false },
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { mutate, setProperty, throwErrorWithMessageIf } from "shared-runtime";

function useFoo(t0) {
  const $ = _c(4);
  const { value, cond } = t0;
  let t1;
  let t2;
  if ($[0] !== value || $[1] !== cond) {
    t2 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const y = [value];
      const x = { cond };
      try {
        mutate(x);
        throwErrorWithMessageIf(x.cond, "error");
      } catch {
        setProperty(x, "henderson");
        t2 = x;
        break bb0;
      }

      t1 = y;
      setProperty(x, "nevada");
      y.push(x);
    }
    $[0] = value;
    $[1] = cond;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    return t2;
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ value: 4, cond: true }],
  sequentialRenders: [
    { value: 4, cond: true },
    { value: 5, cond: true },
    { value: 5, cond: false },
  ],
};

```
      
### Eval output
(kind: ok) {"cond":true,"wat0":"joe","wat1":"henderson"}
{"cond":true,"wat0":"joe","wat1":"henderson"}
[5,{"cond":false,"wat0":"joe","wat1":"nevada"}]