
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
  }, [foo, props]);

  return null;
}

```

## Code

```javascript
import { c as _c, useFire } from "react/compiler-runtime"; // @enableFire
import { fire } from "react";

function Component(props) {
  const $ = _c(4);
  const foo = _temp;
  const t0 = useFire(foo);
  let t1;
  let t2;
  if ($[0] !== props || $[1] !== t0) {
    t1 = () => {
      t0(props);
    };
    t2 = [t0, props];
    $[0] = props;
    $[1] = t0;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);

  return null;
}
function _temp(props_0) {
  console.log(props_0);
}

```
      
### Eval output
(kind: exception) Fixture not implemented