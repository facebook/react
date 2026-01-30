
## Input

```javascript
// @enableFire @enableEmitHookGuards
import {fire} from 'react';

function Component(props) {
  const foo = props => {
    console.log(props);
  };
  useEffect(() => {
    fire(foo(props));
  });

  return null;
}

```

## Code

```javascript
import { $dispatcherGuard } from "react-compiler-runtime";
import { c as _c, useFire } from "react/compiler-runtime"; // @enableFire @enableEmitHookGuards
import { fire } from "react";

function Component(props) {
  const $ = _c(3);
  try {
    $dispatcherGuard(0);
    const foo = _temp;
    const t0 = (function () {
      try {
        $dispatcherGuard(2);
        return useFire(foo);
      } finally {
        $dispatcherGuard(3);
      }
    })();
    let t1;
    if ($[0] !== props || $[1] !== t0) {
      t1 = () => {
        t0(props);
      };
      $[0] = props;
      $[1] = t0;
      $[2] = t1;
    } else {
      t1 = $[2];
    }
    (function () {
      try {
        $dispatcherGuard(2);
        return useEffect(t1);
      } finally {
        $dispatcherGuard(3);
      }
    })();

    return null;
  } finally {
    $dispatcherGuard(1);
  }
}
function _temp(props_0) {
  console.log(props_0);
}

```
      
### Eval output
(kind: exception) Fixture not implemented