
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

This setState() appears to derive a value both props and local state [prefix, name]. This state value shadows a value passed as a prop. Instead of shadowing the prop with local state, hoist the state to the parent component and update it there.

error.bug-derived-state-from-mixed-deps.ts:9:4
   7 |
   8 |   useEffect(() => {
>  9 |     setDisplayName(prefix + name);
     |     ^^^^^^^^^^^^^^ This state value shadows a value passed as a prop or a value from state.
  10 |   }, [prefix, name]);
  11 |
  12 |   return (
```
          
      