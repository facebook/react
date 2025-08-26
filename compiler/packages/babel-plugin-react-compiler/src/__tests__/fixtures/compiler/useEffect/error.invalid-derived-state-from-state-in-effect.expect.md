
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

Error: Derive values in render, not effects.

This setState() appears to derive a value local state [firstName, lastName]. This state value shadows a value passed as a prop. Instead of shadowing the prop with local state, hoist the state to the parent component and update it there.

error.invalid-derived-state-from-state-in-effect.ts:10:4
   8 |
   9 |   useEffect(() => {
> 10 |     setFullName(firstName + ' ' + lastName);
     |     ^^^^^^^^^^^
  11 |   }, [firstName, lastName]);
  12 |
  13 |   return (
```
          
      