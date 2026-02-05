
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = props => {
    console.log(props);
  };
  useEffect(() => {
    fire(foo(props));
    function nested() {
      fire(foo(props));
      function innerNested() {
        fire(foo(props));
      }
    }

    nested();
  });

  return null;
}

```

## Code

```javascript
import { c as _c, useFire } from "react/compiler-runtime"; // @enableFire
import { fire } from "react";

function Component(props) {
  const $ = _c(3);
  const foo = _temp;
  const t0 = useFire(foo);
  let t1;
  if ($[0] !== props || $[1] !== t0) {
    t1 = () => {
      t0(props);
      const nested = function nested() {
        t0(props);
      };

      nested();
    };
    $[0] = props;
    $[1] = t0;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  useEffect(t1);

  return null;
}
function _temp(props_0) {
  console.log(props_0);
}

```
      
### Eval output
(kind: exception) Fixture not implemented