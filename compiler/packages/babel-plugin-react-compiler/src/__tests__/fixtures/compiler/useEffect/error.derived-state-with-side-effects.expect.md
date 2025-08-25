
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

Error: You may not need this effect. Values derived from state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

You are using invalid dependencies:

Invalid deps from props [value].

error.derived-state-with-side-effects.ts:9:4
   7 |   useEffect(() => {
   8 |     console.log('Value changed:', value);
>  9 |     setLocalValue(value);
     |     ^^^^^^^^^^^^^ You may not need this effect. Values derived from state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
  10 |     document.title = `Value: ${value}`;
  11 |   }, [value]);
  12 |
```
          
      