
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({prefix}) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    setDisplayName(prefix + name);
  }, [prefix, name]);

  return (
    <div>
      <input value={name} onChange={e => setName(e.target.value)} />
      <div>{displayName}</div>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{prefix: 'Hello, '}],
};

```


## Error

```
Found 1 error:

Error: Derive values in render, not effects.

This setState() appears to derive a value both props and local state [prefix, name]. Derived values should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.bug-derived-state-from-mixed-deps.ts:9:4
   7 |
   8 |   useEffect(() => {
>  9 |     setDisplayName(prefix + name);
     |     ^^^^^^^^^^^^^^ This state value shadows a value passed as a prop or a value from state.
  10 |   }, [prefix, name]);
  11 |
  12 |   return (
```
          
      