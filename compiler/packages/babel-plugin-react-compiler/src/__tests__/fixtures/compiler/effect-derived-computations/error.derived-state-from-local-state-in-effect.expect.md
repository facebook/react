
## Input

```javascript
// @validateNoDerivedComputationsInEffects

import {useEffect, useState} from 'react';

function Component({shouldChange}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (shouldChange) {
      setCount(count + 1);
    }
  }, [count]);

  return <div>{count}</div>;
}

```


## Error

```
Found 1 error:

Error: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

error.derived-state-from-local-state-in-effect.ts:10:6
   8 |   useEffect(() => {
   9 |     if (shouldChange) {
> 10 |       setCount(count + 1);
     |       ^^^^^^^^ Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
  11 |     }
  12 |   }, [count]);
  13 |
```
          
      