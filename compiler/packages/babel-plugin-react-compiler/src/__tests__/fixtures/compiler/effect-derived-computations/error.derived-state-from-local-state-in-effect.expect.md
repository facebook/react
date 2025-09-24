
## Input

```javascript
// @validateNoDerivedComputationsInEffects

import { useEffect, useState } from 'react';

function Component({shouldChange}) {

  const [count, setCount] = useState(0);

  useEffect(() => {
    if (shouldChange) {
      setCount(count + 1);
    }
  }, [count]);

  return (<div>{count}</div>)
}

```


## Error

```
Found 1 error:

Error: You might not need an effect. Derive values in render, not effects.

Derived values (From local state: [count]) should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.derived-state-from-local-state-in-effect.ts:11:6
   9 |   useEffect(() => {
  10 |     if (shouldChange) {
> 11 |       setCount(count + 1);
     |       ^^^^^^^^ This should be computed during render, not in an effect
  12 |     }
  13 |   }, [count]);
  14 |
```
          
      