
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function MockComponent({onSet}) {
  return <div onClick={() => onSet('clicked')}>Mock Component</div>;
}

function Component({propValue}) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    setValue(propValue);
  }, [propValue]);

  return <MockComponent onSet={setValue} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{propValue: 'test'}],
};

```


## Error

```
Found 1 error:

Error: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

error.derived-state-from-prop-setter-used-outside-effect-no-error.ts:11:4
   9 |   const [value, setValue] = useState(null);
  10 |   useEffect(() => {
> 11 |     setValue(propValue);
     |     ^^^^^^^^ Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
  12 |   }, [propValue]);
  13 |
  14 |   return <MockComponent onSet={setValue} />;
```
          
      