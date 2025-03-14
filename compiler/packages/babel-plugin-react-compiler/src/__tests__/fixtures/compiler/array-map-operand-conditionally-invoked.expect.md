
## Input

```javascript
function useFoo({arr}) {
  return arr.map(e => arr[0].value + e.value);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{arr: []}],
  sequentialRenders: [{arr: []}, {arr: [{value: 1}, {value: 2}]}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function useFoo(t0) {
  const $ = _c(4);
  const { arr } = t0;
  let t1;
  if ($[0] !== arr) {
    let t2;
    if ($[2] !== arr[0]) {
      t2 = (e) => arr[0].value + e.value;
      $[2] = arr[0];
      $[3] = t2;
    } else {
      t2 = $[3];
    }
    t1 = arr.map(t2);
    $[0] = arr;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ arr: [] }],
  sequentialRenders: [{ arr: [] }, { arr: [{ value: 1 }, { value: 2 }] }],
};

```
      
### Eval output
(kind: ok) []
[2,3]