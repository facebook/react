
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp
import {useEffect, useState} from 'react';

export default function Component({props}) {
  const [fullName, setFullName] = useState(
    props.firstName + ' ' + props.lastName
  );

  useEffect(() => {
    setFullName(props.firstName + ' ' + props.lastName);
  }, [props.firstName, props.lastName]);

  return <div>{fullName}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{props: {firstName: 'John', lastName: 'Doe'}}],
};

```


## Error

```
Found 1 error:

Error: You might not need an effect. Derive values in render, not effects.

Derived values (From props: [props]) should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.invalid-derived-state-from-destructured-props.ts:10:4
   8 |
   9 |   useEffect(() => {
> 10 |     setFullName(props.firstName + ' ' + props.lastName);
     |     ^^^^^^^^^^^ This should be computed during render, not in an effect
  11 |   }, [props.firstName, props.lastName]);
  12 |
  13 |   return <div>{fullName}</div>;
```
          
      