
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component({props, bar}) {
  'use no memo';
  const foo = () => {
    console.log(props);
  };
  useEffect(() => {
    fire(foo(props));
    fire(foo());
    fire(bar());
  });

  return null;
}

```

## Code

```javascript
// @enableFire
import { fire } from "react";

function Component({ props, bar }) {
  "use no memo";
  const foo = () => {
    console.log(props);
  };
  useEffect(() => {
    fire(foo(props));
    fire(foo());
    fire(bar());
  });

  return null;
}

```
      
### Eval output
(kind: exception) Fixture not implemented