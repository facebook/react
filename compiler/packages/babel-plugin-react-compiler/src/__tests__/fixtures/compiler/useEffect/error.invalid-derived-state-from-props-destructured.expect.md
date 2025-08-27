
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({props}) {
  const [fullName, setFullName] = useState(props.firstName + ' ' + props.lastName);

  useEffect(() => {
    setFullName(props.firstName + ' ' + props.lastName);
  }, [props.firstName, props.lastName]);

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

This setState() appears to derive a value from props [props]. Derived values should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.invalid-derived-state-from-props-destructured.ts:8:4
   6 |
   7 |   useEffect(() => {
>  8 |     setFullName(props.firstName + ' ' + props.lastName);
     |     ^^^^^^^^^^^ This should be computed during render, not in an effect
   9 |   }, [props.firstName, props.lastName]);
  10 |
  11 |   return <div>{fullName}</div>;
```
          
      