
## Input

```javascript
import {PrimitiveBox} from 'shared-runtime';

function Component({value, realmax}) {
  const box = new PrimitiveBox(value);
  const maxValue = Math.max(box.get(), realmax);
  //                        ^^^^^^^^^ should not be separated into static call
  return <div>{maxValue}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 42, realmax: 100}],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { PrimitiveBox } from "shared-runtime";

function Component(t0) {
  const $ = _c(6);
  const { value, realmax } = t0;
  let t1;
  let t2;
  let t3;
  if ($[0] !== value) {
    const box = new PrimitiveBox(value);
    t1 = Math;
    t2 = t1.max;
    t3 = box.get();
    $[0] = value;
    $[1] = t1;
    $[2] = t2;
    $[3] = t3;
  } else {
    t1 = $[1];
    t2 = $[2];
    t3 = $[3];
  }
  const maxValue = t2(t3, realmax);
  let t4;
  if ($[4] !== maxValue) {
    t4 = <div>{maxValue}</div>;
    $[4] = maxValue;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42, realmax: 100 }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>100</div>