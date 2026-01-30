
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = () => {
    console.log(props);
  };
  useEffect(() => {
    fire(foo(props));
    fire(foo(props));
  });

  return null;
}

```

## Code

```javascript
import { c as _c, useFire } from "react/compiler-runtime"; // @enableFire
import { fire } from "react";

function Component(props) {
  const $ = _c(5);
  let t0;
  if ($[0] !== props) {
    t0 = () => {
      console.log(props);
    };
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const foo = t0;
  const t1 = useFire(foo);
  let t2;
  if ($[2] !== props || $[3] !== t1) {
    t2 = () => {
      t1(props);
      t1(props);
    };
    $[2] = props;
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  useEffect(t2);

  return null;
}

```
      
### Eval output
(kind: exception) Fixture not implemented