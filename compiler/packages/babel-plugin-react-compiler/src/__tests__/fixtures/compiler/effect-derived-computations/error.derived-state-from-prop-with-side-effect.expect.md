
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({value}) {
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
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

Error: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

error.derived-state-from-prop-with-side-effect.ts:8:4
   6 |
   7 |   useEffect(() => {
>  8 |     setLocalValue(value);
     |     ^^^^^^^^^^^^^ Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
   9 |     document.title = `Value: ${value}`;
  10 |   }, [value]);
  11 |
```
          
      