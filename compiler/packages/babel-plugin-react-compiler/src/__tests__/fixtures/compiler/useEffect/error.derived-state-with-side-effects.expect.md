
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({value}) {
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    console.log('Value changed:', value);
    setLocalValue(value);
    document.title = `Value: ${value}`;
  }, [value]);

  return <div>{localValue}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'test'}],
};

```


## Error

```
Found 1 error:

Error: Derive values in render, not effects.

This setState() appears to derive a value from props [value]. This state value shadows a value passed as a prop. Instead of shadowing the prop with local state, hoist the state to the parent component and update it there.

error.derived-state-with-side-effects.ts:9:4
   7 |   useEffect(() => {
   8 |     console.log('Value changed:', value);
>  9 |     setLocalValue(value);
     |     ^^^^^^^^^^^^^ This state value shadows a value passed as a prop.
  10 |     document.title = `Value: ${value}`;
  11 |   }, [value]);
  12 |
```
          
      