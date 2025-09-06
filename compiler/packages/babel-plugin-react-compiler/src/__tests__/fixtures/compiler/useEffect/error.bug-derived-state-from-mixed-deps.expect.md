
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

Error: You might not need an effect. Derive values in render, not effects.

Both props and local state [prefix, name]. Derived values should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.bug-derived-state-from-mixed-deps.ts:9:4
   7 |
   8 |   useEffect(() => {
>  9 |     setDisplayName(prefix + name);
     |     ^^^^^^^^^^^^^^ This should be computed during render, not in an effect
  10 |   }, [prefix, name]);
  11 |
  12 |   return (
```
          
      