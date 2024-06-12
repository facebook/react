
## Input

```javascript
function useFoo({ obj, objIsNull }) {
  const x = [];
  if (objIsNull) {
    return;
  }
  x.push(obj.b);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ obj: null, objIsNull: true }],
  sequentialRenders: [
    { obj: null, objIsNull: true },
    { obj: { a: 2 }, objIsNull: false },
    // check we preserve nullthrows
    { obj: { a: undefined }, objIsNull: false },
    { obj: undefined, objIsNull: false },
    { obj: { a: undefined }, objIsNull: false },
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function useFoo(t0) {
  const $ = _c(4);
  const { obj, objIsNull } = t0;
  let t1;
  let t2;
  if ($[0] !== objIsNull || $[1] !== obj) {
    t2 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const x = [];
      if (objIsNull) {
        t2 = undefined;
        break bb0;
      }

      t1 = x;
      x.push(obj.b);
    }
    $[0] = objIsNull;
    $[1] = obj;
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
  params: [{ obj: null, objIsNull: true }],
  sequentialRenders: [
    { obj: null, objIsNull: true },
    { obj: { a: 2 }, objIsNull: false },
    // check we preserve nullthrows
    { obj: { a: undefined }, objIsNull: false },
    { obj: undefined, objIsNull: false },
    { obj: { a: undefined }, objIsNull: false },
  ],
};

```
      
### Eval output
(kind: ok) 
[null]
[null]
[[ (exception in render) TypeError: Cannot read properties of undefined (reading 'b') ]]
[null]