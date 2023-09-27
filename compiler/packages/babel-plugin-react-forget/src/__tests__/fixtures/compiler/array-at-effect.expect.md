
## Input

```javascript
// arrayInstance.at should have the following effects:
//  - read on arg0
//  - read on receiver
//  - mutate on lvalue
function ArrayAtTest(props) {
  const arr = [foo(props.x)];
  const result = arr.at(bar(props.y));
  return result;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // arrayInstance.at should have the following effects:
//  - read on arg0
//  - read on receiver
//  - mutate on lvalue
function ArrayAtTest(props) {
  const $ = useMemoCache(8);
  const c_0 = $[0] !== props.x;
  let t0;
  let t1;
  if (c_0) {
    t0 = foo(props.x);
    t1 = [t0];
    $[0] = props.x;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  const arr = t1;
  const c_3 = $[3] !== props.y;
  const c_4 = $[4] !== arr;
  let t3;
  if (c_3 || c_4) {
    const c_6 = $[6] !== props.y;
    let t2;
    if (c_6) {
      t2 = bar(props.y);
      $[6] = props.y;
      $[7] = t2;
    } else {
      t2 = $[7];
    }
    t3 = arr.at(t2);
    $[3] = props.y;
    $[4] = arr;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const result = t3;
  return result;
}

```
      