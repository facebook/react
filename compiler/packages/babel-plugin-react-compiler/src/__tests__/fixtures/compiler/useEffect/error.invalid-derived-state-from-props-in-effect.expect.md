
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

Error: You might not need an effect. Derive values in render, not effects.

props [firstName, lastName]. Derived values should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.invalid-derived-state-from-props-in-effect.ts:8:4
   6 |
   7 |   useEffect(() => {
>  8 |     setFullName(firstName + ' ' + lastName);
     |     ^^^^^^^^^^^ This should be computed during render, not in an effect
   9 |   }, [firstName, lastName]);
  10 |
  11 |   return <div>{fullName}</div>;
```
          
      