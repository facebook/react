
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

Compilation Skipped: `this` is not supported syntax

React Compiler does not support compiling functions that use `this`.

error.reserved-words.ts:8:28
   6 |
   7 |   if (ref.current === null) {
>  8 |     ref.current = function (this: unknown, ...args) {
     |                             ^^^^^^^^^^^^^ `this` was used here
   9 |       return fnRef.current.call(this, ...args);
  10 |     };
  11 |   }
```
          
      