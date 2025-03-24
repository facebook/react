
## Input

```javascript
const MODULE_LOCAL = new Set([4, 5, 6]);
function useFoo({propArr}: {propArr: Array<number>}) {
  /* TODO: Array can be memoized separately of the Set */
  const s1 = new Set([1, 2, 3]);
  s1.add(propArr[0]);

  /* but `.values` cannot be memoized separately */
  const s2 = new Set(MODULE_LOCAL.values());
  s2.add(propArr[1]);

  const s3 = new Set(s2.values());
  s3.add(propArr[2]);

  /**
   * TODO: s3 should be memoized separately of s4
   */
  const s4 = new Set(s3);
  s4.add(propArr[3]);
  return [s1, s2, s3, s4];
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{propArr: [7, 8, 9]}],
  sequentialRenders: [{propArr: [7, 8, 9]}, {propArr: [7, 8, 10]}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
const MODULE_LOCAL = new Set([4, 5, 6]);
function useFoo(t0) {
  const $ = _c(13);
  const { propArr } = t0;
  let s1;
  if ($[0] !== propArr[0]) {
    s1 = new Set([1, 2, 3]);
    s1.add(propArr[0]);
    $[0] = propArr[0];
    $[1] = s1;
  } else {
    s1 = $[1];
  }
  let s2;
  let s3;
  let s4;
  if ($[2] !== propArr[1] || $[3] !== propArr[2] || $[4] !== propArr[3]) {
    s2 = new Set(MODULE_LOCAL.values());
    s2.add(propArr[1]);

    s3 = new Set(s2.values());
    s3.add(propArr[2]);

    s4 = new Set(s3);
    s4.add(propArr[3]);
    $[2] = propArr[1];
    $[3] = propArr[2];
    $[4] = propArr[3];
    $[5] = s2;
    $[6] = s3;
    $[7] = s4;
  } else {
    s2 = $[5];
    s3 = $[6];
    s4 = $[7];
  }
  let t1;
  if ($[8] !== s1 || $[9] !== s2 || $[10] !== s3 || $[11] !== s4) {
    t1 = [s1, s2, s3, s4];
    $[8] = s1;
    $[9] = s2;
    $[10] = s3;
    $[11] = s4;
    $[12] = t1;
  } else {
    t1 = $[12];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ propArr: [7, 8, 9] }],
  sequentialRenders: [{ propArr: [7, 8, 9] }, { propArr: [7, 8, 10] }],
};

```
      
### Eval output
(kind: ok) [{"kind":"Set","value":[1,2,3,7]},{"kind":"Set","value":[4,5,6,8]},{"kind":"Set","value":[4,5,6,8,9]},{"kind":"Set","value":[4,5,6,8,9,null]}]
[{"kind":"Set","value":[1,2,3,7]},{"kind":"Set","value":[4,5,6,8]},{"kind":"Set","value":[4,5,6,8,10]},{"kind":"Set","value":[4,5,6,8,10,null]}]