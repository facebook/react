
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

Error: Derive values in render, not effects.

This setState() appears to derive a value from props [firstName, lastName]. This state value shadows a value passed as a prop. Instead of shadowing the prop with local state, hoist the state to the parent component and update it there.

error.invalid-derived-state-from-props-destructured.ts:8:4
   6 |
   7 |   useEffect(() => {
>  8 |     setFullName(firstName + ' ' + lastName);
     |     ^^^^^^^^^^^ This state value shadows a value passed as a prop.
   9 |   }, [firstName, lastName]);
  10 |
  11 |   return <div>{fullName}</div>;
```
          
      