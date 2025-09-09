
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component() {
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    setFullName(firstName + ' ' + lastName);
  }, [firstName, lastName]);

  return (
    <div>
      <input value={firstName} onChange={e => setFirstName(e.target.value)} />
      <input value={lastName} onChange={e => setLastName(e.target.value)} />
      <div>{fullName}</div>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```


## Error

```
Found 1 error:

Error: You may not need this effect. Values derived from state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

This effect updates state based on other state values. Consider calculating this value directly during render.

error.invalid-derived-state-from-state-in-effect.ts:10:4
   8 |
   9 |   useEffect(() => {
> 10 |     setFullName(firstName + ' ' + lastName);
     |     ^^^^^^^^^^^ You may not need this effect. Values derived from state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
  11 |   }, [firstName, lastName]);
  12 |
  13 |   return (
```
          
      