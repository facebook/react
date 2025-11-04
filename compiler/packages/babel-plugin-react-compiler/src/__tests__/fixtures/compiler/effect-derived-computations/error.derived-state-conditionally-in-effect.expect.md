
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp
import {useEffect, useState} from 'react';

function Component({value, enabled}) {
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (enabled) {
      setLocalValue(value);
    } else {
      setLocalValue('disabled');
    }
  }, [value, enabled]);

  return <div>{localValue}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'test', enabled: true}],
};

```


## Error

```
Found 1 error:

Error: You might not need an effect. Derive values in render, not effects.

Derived values (From props: [value]) should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.derived-state-conditionally-in-effect.ts:9:6
   7 |   useEffect(() => {
   8 |     if (enabled) {
>  9 |       setLocalValue(value);
     |       ^^^^^^^^^^^^^ This should be computed during render, not in an effect
  10 |     } else {
  11 |       setLocalValue('disabled');
  12 |     }
```
          
      