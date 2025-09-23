
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({propValue, onChange}) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    setValue(propValue);
    onChange();
  }, [propValue]);

  return <div>{value}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{propValue: 'test', onChange: () => {}}],
};

```


## Error

```
Found 1 error:

Error: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

error.effect-contains-prop-function-call-no-error.ts:7:4
   5 |   const [value, setValue] = useState(null);
   6 |   useEffect(() => {
>  7 |     setValue(propValue);
     |     ^^^^^^^^^^^^^^^^^^^ Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
   8 |     onChange();
   9 |   }, [propValue]);
  10 |
```
          
      