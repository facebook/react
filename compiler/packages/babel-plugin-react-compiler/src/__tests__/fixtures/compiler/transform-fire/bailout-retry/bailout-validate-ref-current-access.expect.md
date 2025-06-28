
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
import { useFire } from "react/compiler-runtime";
import { fire } from "react";
import { print } from "shared-runtime";

const Component = React.forwardRef(Component_withRef);
function Component_withRef(t0, ref) {
  const { prop1 } = t0;
  const foo = () => {
    console.log(prop1);
  };
  const t1 = useFire(foo);
  useEffect(() => {
    t1(prop1);
    bar();
    t1();
  });
  print(ref.current);
  return null;
}

```
      
### Eval output
(kind: exception) Fixture not implemented