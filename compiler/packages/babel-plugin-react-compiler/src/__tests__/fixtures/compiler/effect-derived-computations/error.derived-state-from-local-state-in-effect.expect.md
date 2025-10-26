
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp

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

Error: You might not need an effect. Derive values in render, not effects.

Derived values (From local state: [count]) should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.derived-state-from-local-state-in-effect.ts:10:6
   8 |   useEffect(() => {
   9 |     if (shouldChange) {
> 10 |       setCount(count + 1);
     |       ^^^^^^^^ This should be computed during render, not in an effect
  11 |     }
  12 |   }, [count]);
  13 |
```
          
      