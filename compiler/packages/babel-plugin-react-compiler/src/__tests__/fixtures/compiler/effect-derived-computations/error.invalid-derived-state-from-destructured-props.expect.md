
## Input

```javascript
// @validateNoDerivedComputationsInEffects
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

Error: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

error.invalid-derived-state-from-destructured-props.ts:10:4
   8 |
   9 |   useEffect(() => {
> 10 |     setFullName(props.firstName + ' ' + props.lastName);
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
  11 |   }, [props.firstName, props.lastName]);
  12 |
  13 |   return <div>{fullName}</div>;
```
          
      