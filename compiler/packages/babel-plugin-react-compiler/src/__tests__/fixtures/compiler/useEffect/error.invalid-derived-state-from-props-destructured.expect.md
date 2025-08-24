
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({firstName, lastName}) {
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    setFullName(firstName + ' ' + lastName);
  }, [firstName, lastName]);

  return <div>{fullName}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{firstName: 'John', lastName: 'Doe'}],
};

```


## Error

```
Found 1 error:

Error: You may not need this effect. Values derived from state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

You are using invalid dependencies:

Invalid deps from props [firstName, lastName].

error.invalid-derived-state-from-props-destructured.ts:8:4
   6 |
   7 |   useEffect(() => {
>  8 |     setFullName(firstName + ' ' + lastName);
     |     ^^^^^^^^^^^ You may not need this effect. Values derived from state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
   9 |   }, [firstName, lastName]);
  10 |
  11 |   return <div>{fullName}</div>;
```
          
      