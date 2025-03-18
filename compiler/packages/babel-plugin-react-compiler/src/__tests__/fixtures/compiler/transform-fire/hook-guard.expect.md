
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
import { $dispatcherGuard as _$dispatcherGuard } from "react-compiler-runtime";
import { useFire as _useFire } from "react/compiler-runtime";
import { c as _c } from "react/compiler-runtime"; // @enableFire @enableEmitHookGuards
import { fire } from "react";

function Component(props) {
  const $ = _c(3);
  try {
    _$dispatcherGuard(0);
    const foo = _temp;
    const t0 = (function () {
      try {
        _$dispatcherGuard(2);
        return _useFire(foo);
      } finally {
        _$dispatcherGuard(3);
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
        _$dispatcherGuard(2);
        return useEffect(t1);
      } finally {
        _$dispatcherGuard(3);
      }
    })();
    return null;
  } finally {
    _$dispatcherGuard(1);
  }
}
function _temp(props_0) {
  console.log(props_0);
}

```
      
### Eval output
(kind: exception) Fixture not implemented