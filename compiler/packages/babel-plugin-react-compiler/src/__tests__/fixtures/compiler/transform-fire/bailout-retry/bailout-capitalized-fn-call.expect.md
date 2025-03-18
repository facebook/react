
## Input

```javascript
// @validateNoCapitalizedCalls @enableFire @panicThreshold(none)
import {fire} from 'react';
const CapitalizedCall = require('shared-runtime').sum;

function Component({prop1, bar}) {
  const foo = () => {
    console.log(prop1);
  };
  useEffect(() => {
    fire(foo(prop1));
    fire(foo());
    fire(bar());
  });

  return CapitalizedCall();
}

```

## Code

```javascript
import { useFire as _useFire } from "react/compiler-runtime"; // @validateNoCapitalizedCalls @enableFire @panicThreshold(none)
import { fire } from "react";
const CapitalizedCall = require("shared-runtime").sum;

function Component(t0) {
  const { prop1, bar } = t0;
  const foo = () => {
    console.log(prop1);
  };
  const t1 = _useFire(foo);
  const t2 = _useFire(bar);

  useEffect(() => {
    t1(prop1);
    t1();
    t2();
  });
  return CapitalizedCall();
}

```
      
### Eval output
(kind: exception) Fixture not implemented