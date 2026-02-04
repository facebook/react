
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees @enableFire @panicThreshold:"none"
import {fire} from 'react';
import {sum} from 'shared-runtime';

function Component({prop1, bar}) {
  const foo = () => {
    console.log(prop1);
  };
  useEffect(() => {
    fire(foo(prop1));
    fire(foo());
    fire(bar());
  });

  return useMemo(() => sum(bar), []);
}

```

## Code

```javascript
import { useFire } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees @enableFire @panicThreshold:"none"
import { fire } from "react";
import { sum } from "shared-runtime";

function Component(t0) {
  const { prop1, bar } = t0;
  const foo = () => {
    console.log(prop1);
  };
  const t1 = useFire(foo);
  const t2 = useFire(bar);

  useEffect(() => {
    t1(prop1);
    t1();
    t2();
  });

  return useMemo(() => sum(bar), []);
}

```
      
### Eval output
(kind: exception) Fixture not implemented