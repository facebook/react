
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp
import {useEffect, useState} from 'react';

function Component() {
  const [firstName, setFirstName] = useState('Taylor');
  const lastName = 'Swift';

  // 🔴 Avoid: redundant state and unnecessary Effect
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    setFullName(firstName + ' ' + lastName);
  }, [firstName, lastName]);

  return <div>{fullName}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```


## Error

```
Found 1 error:

Error: You might not need an effect. Derive values in render, not effects.

Derived values (From local state: [firstName]) should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.invalid-derived-computation-in-effect.ts:11:4
   9 |   const [fullName, setFullName] = useState('');
  10 |   useEffect(() => {
> 11 |     setFullName(firstName + ' ' + lastName);
     |     ^^^^^^^^^^^ This should be computed during render, not in an effect
  12 |   }, [firstName, lastName]);
  13 |
  14 |   return <div>{fullName}</div>;
```
          
      