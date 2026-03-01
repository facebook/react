
## Input

```javascript
// @enableNewMutationAliasingModel
function useHook({el1, el2}) {
  const s = new Set();
  const arr = makeArray(el1);
  s.add(arr);
  // Mutate after store
  arr.push(el2);

  s.add(makeArray(el2));
  return s.size;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableNewMutationAliasingModel
function useHook(t0) {
  const $ = _c(7);
  const { el1, el2 } = t0;
  let s;
  if ($[0] !== el1 || $[1] !== el2) {
    s = new Set();
    let t1;
    if ($[3] !== el1) {
      t1 = makeArray(el1);
      $[3] = el1;
      $[4] = t1;
    } else {
      t1 = $[4];
    }
    const arr = t1;
    s.add(arr);

    arr.push(el2);
    let t2;
    if ($[5] !== el2) {
      t2 = makeArray(el2);
      $[5] = el2;
      $[6] = t2;
    } else {
      t2 = $[6];
    }
    s.add(t2);
    $[0] = el1;
    $[1] = el2;
    $[2] = s;
  } else {
    s = $[2];
  }
  return s.size;
}

```
      
### Eval output
(kind: exception) Fixture not implemented