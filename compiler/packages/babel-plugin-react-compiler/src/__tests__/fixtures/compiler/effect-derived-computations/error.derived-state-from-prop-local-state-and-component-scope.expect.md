
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp
import {useEffect, useState} from 'react';

function Component({firstName}) {
  const [lastName, setLastName] = useState('Doe');
  const [fullName, setFullName] = useState('John');

  const middleName = 'D.';

  useEffect(() => {
    setFullName(firstName + ' ' + middleName + ' ' + lastName);
  }, [firstName, middleName, lastName]);

  return (
    <div>
      <input value={lastName} onChange={e => setLastName(e.target.value)} />
      <div>{fullName}</div>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{firstName: 'John'}],
};

```


## Error

```
Found 1 error:

Error: You might not need an effect. Derive values in render, not effects.

Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user

This setState call is setting a derived value that depends on the following reactive sources:

Props: [firstName]
State: [lastName]

Data Flow Tree:
├── firstName (Prop)
└── lastName (State)

See: https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state.

error.derived-state-from-prop-local-state-and-component-scope.ts:11:4
   9 |
  10 |   useEffect(() => {
> 11 |     setFullName(firstName + ' ' + middleName + ' ' + lastName);
     |     ^^^^^^^^^^^ This should be computed during render, not in an effect
  12 |   }, [firstName, middleName, lastName]);
  13 |
  14 |   return (
```
          
      