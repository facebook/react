
## Input

```javascript
// @flow @enableFire @panicThreshold:"none"
import {fire} from 'react';
import {print} from 'shared-runtime';

component Component(prop1, ref) {
  const foo = () => {
    console.log(prop1);
  };
  useEffect(() => {
    fire(foo(prop1));
    bar();
    fire(foo());
  });

  print(ref.current);
  return null;
}

```

## Code

```javascript
import { c as _c, useFire } from "react/compiler-runtime";
import { fire } from "react";
import { print } from "shared-runtime";

const Component = React.forwardRef(Component_withRef);
function Component_withRef(t0, ref) {
  const $ = _c(5);
  const { prop1 } = t0;
  let t1;
  if ($[0] !== prop1) {
    t1 = () => {
      console.log(prop1);
    };
    $[0] = prop1;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const foo = t1;
  const t2 = useFire(foo);
  let t3;
  if ($[2] !== prop1 || $[3] !== t2) {
    t3 = () => {
      t2(prop1);
      bar();
      t2();
    };
    $[2] = prop1;
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  useEffect(t3);
  print(ref.current);
  return null;
}

```
      
### Eval output
(kind: exception) Fixture not implemented