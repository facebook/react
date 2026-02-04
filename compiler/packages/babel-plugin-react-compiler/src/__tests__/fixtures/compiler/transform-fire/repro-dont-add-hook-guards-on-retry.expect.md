
## Input

```javascript
// @flow @enableEmitHookGuards @panicThreshold:"none" @enableFire
import {useEffect, fire} from 'react';

function Component(props, useDynamicHook) {
  'use memo';
  useDynamicHook();
  const foo = props => {
    console.log(props);
  };
  useEffect(() => {
    fire(foo(props));
  });

  return <div>hello world</div>;
}

```

## Code

```javascript
import { useFire } from "react/compiler-runtime";
import { useEffect, fire } from "react";

function Component(props, useDynamicHook) {
  "use memo";

  useDynamicHook();
  const foo = _temp;
  const t0 = useFire(foo);

  useEffect(() => {
    t0(props);
  });

  return <div>hello world</div>;
}
function _temp(props_0) {
  console.log(props_0);
}

```
      
### Eval output
(kind: exception) Fixture not implemented