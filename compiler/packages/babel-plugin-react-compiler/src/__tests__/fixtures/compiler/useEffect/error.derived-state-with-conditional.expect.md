
## Input

```javascript
// @validateNoDerivedComputationsInEffects
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

Error: Derive values in render, not effects.

This setState() appears to derive a value from props [value]. This state value shadows a value passed as a prop. Instead of shadowing the prop with local state, hoist the state to the parent component and update it there.

error.derived-state-with-conditional.ts:9:6
   7 |   useEffect(() => {
   8 |     if (enabled) {
>  9 |       setLocalValue(value);
     |       ^^^^^^^^^^^^^ This state value shadows a value passed as a prop.
  10 |     } else {
  11 |       setLocalValue('disabled');
  12 |     }
```
          
      