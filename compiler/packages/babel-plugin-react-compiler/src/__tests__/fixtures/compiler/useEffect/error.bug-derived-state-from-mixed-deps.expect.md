
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

Error: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

error.derived-state-from-mixed-deps-no-error.ts:9:4
   7 |
   8 |   useEffect(() => {
>  9 |     setDisplayName(prefix + name);
     |     ^^^^^^^^^^^^^^ Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
  10 |   }, [prefix, name]);
  11 |
  12 |   return (
```
          
      