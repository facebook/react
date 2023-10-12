
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
  const $ = useMemoCache(9);
  let t0;
  if ($[0] !== props.x) {
    t0 = foo(props.x);
    $[0] = props.x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== t0) {
    t1 = [t0];
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const arr = t1;
  let t3;
  if ($[4] !== props.y || $[5] !== arr) {
    let t2;
    if ($[7] !== props.y) {
      t2 = bar(props.y);
      $[7] = props.y;
      $[8] = t2;
    } else {
      t2 = $[8];
    }
    t3 = arr.at(t2);
    $[4] = props.y;
    $[5] = arr;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const result = t3;
  return result;
}

```
      