
## Input

```javascript
import {useRef} from 'react';

function useThing(fn) {
  const fnRef = useRef(fn);
  const ref = useRef(null);

  if (ref.current === null) {
    ref.current = function (this: unknown, ...args) {
      return fnRef.current.call(this, ...args);
    };
  }
  return ref.current;
}

```


## Error

```
Found 1 error:

Invariant: [HIRBuilder] Unexpected null block

expected block 0 to exist.
```
          
      