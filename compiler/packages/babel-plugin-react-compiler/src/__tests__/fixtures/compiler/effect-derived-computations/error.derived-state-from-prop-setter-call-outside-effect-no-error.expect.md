
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({initialName}) {
  const [name, setName] = useState('');

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  return (
    <div>
      <input value={name} onChange={e => setName(e.target.value)} />
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{initialName: 'John'}],
};

```


## Error

```
Found 1 error:

Error: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

error.derived-state-from-prop-setter-call-outside-effect-no-error.ts:8:4
   6 |
   7 |   useEffect(() => {
>  8 |     setName(initialName);
     |     ^^^^^^^ Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
   9 |   }, [initialName]);
  10 |
  11 |   return (
```
          
      