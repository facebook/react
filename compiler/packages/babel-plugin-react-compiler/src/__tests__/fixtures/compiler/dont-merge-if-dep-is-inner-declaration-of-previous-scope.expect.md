
## Input

```javascript
import { ValidateMemoization } from "shared-runtime";

// Achieving Forget's level of memoization precision in this example isn't possible with useMemo
// without significantly altering the code, so disable the non-Forget evaluation of this fixture.
// @disableNonForgetInSprout
function Component({ a, b, c }) {
  const x = [];
  let y;
  if (a) {
    y = [b];
  }
  x.push(c);

  // this scope should not merge with the above scope because y does not invalidate
  // on changes to `c`
  const z = [y];

  // return [x, z];
  return (
    <>
      <ValidateMemoization inputs={[a, b, c]} output={x} />
      <ValidateMemoization inputs={[a, b]} output={z} />
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: false, b: null, c: 0 }],
  sequentialRenders: [
    { a: false, b: null, c: 0 },
    { a: false, b: null, c: 1 },
    { a: true, b: 0, c: 1 },
    { a: true, b: 1, c: 1 },
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { ValidateMemoization } from "shared-runtime";

// Achieving Forget's level of memoization precision in this example isn't possible with useMemo
// without significantly altering the code, so disable the non-Forget evaluation of this fixture.
// @disableNonForgetInSprout
function Component(t0) {
  const $ = _c(28);
  const { a, b, c } = t0;
  let t1;
  let t2;
  let t3;
  let t4;
  let x;
  if ($[0] !== a || $[1] !== b || $[2] !== c) {
    x = [];
    let y;
    if (a) {
      let t5;
      if ($[8] !== b) {
        t5 = [b];
        $[8] = b;
        $[9] = t5;
      } else {
        t5 = $[9];
      }
      y = t5;
    }

    t3 = a;
    t4 = b;
    if ($[10] !== a || $[11] !== b) {
      t2 = [a, b];
      $[10] = a;
      $[11] = b;
      $[12] = t2;
    } else {
      t2 = $[12];
    }
    if ($[13] !== y) {
      t1 = [y];
      $[13] = y;
      $[14] = t1;
    } else {
      t1 = $[14];
    }
    x.push(c);
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = t1;
    $[4] = t2;
    $[5] = t3;
    $[6] = t4;
    $[7] = x;
  } else {
    t1 = $[3];
    t2 = $[4];
    t3 = $[5];
    t4 = $[6];
    x = $[7];
  }
  const z = t1;
  let t5;
  if ($[15] !== t2 || $[16] !== z) {
    t5 = <ValidateMemoization inputs={t2} output={z} />;
    $[15] = t2;
    $[16] = z;
    $[17] = t5;
  } else {
    t5 = $[17];
  }
  let t6;
  if ($[18] !== t3 || $[19] !== t4 || $[20] !== c) {
    t6 = [t3, t4, c];
    $[18] = t3;
    $[19] = t4;
    $[20] = c;
    $[21] = t6;
  } else {
    t6 = $[21];
  }
  let t7;
  if ($[22] !== t6 || $[23] !== x) {
    t7 = <ValidateMemoization inputs={t6} output={x} />;
    $[22] = t6;
    $[23] = x;
    $[24] = t7;
  } else {
    t7 = $[24];
  }
  let t8;
  if ($[25] !== t7 || $[26] !== t5) {
    t8 = (
      <>
        {t7}
        {t5}
      </>
    );
    $[25] = t7;
    $[26] = t5;
    $[27] = t8;
  } else {
    t8 = $[27];
  }
  return t8;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: false, b: null, c: 0 }],
  sequentialRenders: [
    { a: false, b: null, c: 0 },
    { a: false, b: null, c: 1 },
    { a: true, b: 0, c: 1 },
    { a: true, b: 1, c: 1 },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[false,null,0],"output":[0]}</div><div>{"inputs":[false,null],"output":[null]}</div>
<div>{"inputs":[false,null,1],"output":[1]}</div><div>{"inputs":[false,null],"output":[null]}</div>
<div>{"inputs":[true,0,1],"output":[1]}</div><div>{"inputs":[true,0],"output":[[0]]}</div>
<div>{"inputs":[true,1,1],"output":[1]}</div><div>{"inputs":[true,1],"output":[[1]]}</div>