
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
  const $ = useMemoCache(7);
  const c_0 = $[0] !== props.x;
  let t0;
  if (c_0) {
    t0 = [foo(props.x)];
    $[0] = props.x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const arr = t0;
  const c_2 = $[2] !== props.y;
  const c_3 = $[3] !== arr;
  let t2;
  if (c_2 || c_3) {
    const c_5 = $[5] !== props.y;
    let t1;
    if (c_5) {
      t1 = bar(props.y);
      $[5] = props.y;
      $[6] = t1;
    } else {
      t1 = $[6];
    }
    t2 = arr.at(t1);
    $[2] = props.y;
    $[3] = arr;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const result = t2;
  return result;
}

```
      