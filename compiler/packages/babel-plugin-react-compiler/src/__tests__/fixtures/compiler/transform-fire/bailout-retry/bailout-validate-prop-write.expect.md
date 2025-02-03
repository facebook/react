
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component({prop1}) {
  const foo = () => {
    console.log(prop1);
  };
  useEffect(() => {
    fire(foo(prop1));
  });
  prop1.value += 1;
}

```

## Code

```javascript
import { useFire } from "react/compiler-runtime"; // @enableFire
import { fire } from "react";

function Component(t0) {
  const { prop1 } = t0;
  const foo = () => {
    console.log(prop1);
  };
  const t1 = useFire(foo);

  useEffect(() => {
    t1(prop1);
  });
  prop1.value = prop1.value + 1;
}

```
      
### Eval output
(kind: exception) Fixture not implemented