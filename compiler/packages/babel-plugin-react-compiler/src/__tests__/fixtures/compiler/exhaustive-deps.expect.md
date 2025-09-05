
## Input

```javascript
import {useMemo} from 'react';
import {Stringify} from 'shared-runtime';

function Component({x, y, z}) {
  const a = useMemo(() => {
    return x?.y.z?.a;
  }, [x?.y.z?.a]);
  const b = useMemo(() => {
    return x.y.z?.a;
  }, [x.y.z?.a]);
  const c = useMemo(() => {
    return x?.y.z.a?.b;
  }, [x?.y.z.a?.b]);
  const d = useMemo(() => {
    return x?.y?.[(console.log(y), z?.b)];
  }, [x?.y, y, z?.b]);
  const e = useMemo(() => {
    const e = [];
    e.push(x);
    return e;
  }, [x]);
  return <Stringify results={[a, b, c, d, e]} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import { Stringify } from "shared-runtime";

function Component(t0) {
  const $ = _c(18);
  const { x, y, z } = t0;

  x?.y.z?.a;
  const a = x?.y.z?.a;
  let t1;
  if ($[0] !== x.y.z.a) {
    t1 = () => x.y.z?.a;
    $[0] = x.y.z.a;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  x.y.z?.a;
  let t2;
  if ($[2] !== t1) {
    t2 = t1();
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const b = t2;

  x?.y.z.a?.b;
  const c = x?.y.z.a?.b;
  let t3;
  if ($[4] !== x.y || $[5] !== y || $[6] !== z?.b) {
    t3 = () => x?.y?.[(console.log(y), z?.b)];
    $[4] = x.y;
    $[5] = y;
    $[6] = z?.b;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  x?.y;
  z?.b;
  let t4;
  if ($[8] !== t3) {
    t4 = t3();
    $[8] = t3;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const d = t4;
  let e;
  if ($[10] !== x) {
    e = [];
    e.push(x);
    $[10] = x;
    $[11] = e;
  } else {
    e = $[11];
  }
  const e_0 = e;
  let t5;
  if (
    $[12] !== a ||
    $[13] !== b ||
    $[14] !== c ||
    $[15] !== d ||
    $[16] !== e_0
  ) {
    t5 = <Stringify results={[a, b, c, d, e_0]} />;
    $[12] = a;
    $[13] = b;
    $[14] = c;
    $[15] = d;
    $[16] = e_0;
    $[17] = t5;
  } else {
    t5 = $[17];
  }
  return t5;
}

```
      
### Eval output
(kind: exception) Fixture not implemented