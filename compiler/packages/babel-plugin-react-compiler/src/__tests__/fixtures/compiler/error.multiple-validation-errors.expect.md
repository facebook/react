
## Input

```javascript
import {useRef, useState, useEffect} from 'react';

function Component() {
  const ref = useRef();
  const [count, setCount] = useState(0);
  
  // Multiple validation errors:
  const refValue = ref.current; // Error 1: ref access during render
  setCount(count + 1); // Error 2: setState during render
  
  
  useEffect(() => {if (count > 0) {
    useEffect(() => {}); // Error 3: conditional hook
  }
  
    setCount(count + 1); // Error 4: setState in effect
  }, [count]);
  
  return <div>{refValue}</div>;
}
```


## Error

```
Found 3 errors:

Error: Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

Cannot call useEffect within a function expression.

error.multiple-validation-errors.ts:13:4
  11 |   
  12 |   useEffect(() => {if (count > 0) {
> 13 |     useEffect(() => {}); // Error 3: conditional hook
     |     ^^^^^^^^^ Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)
  14 |   }
  15 |   
  16 |     setCount(count + 1); // Error 4: setState in effect

Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

error.multiple-validation-errors.ts:8:19
   6 |   
   7 |   // Multiple validation errors:
>  8 |   const refValue = ref.current; // Error 1: ref access during render
     |                    ^^^^^^^^^^^ Cannot access ref value during render
   9 |   setCount(count + 1); // Error 2: setState during render
  10 |   
  11 |

Error: Calling setState during render may trigger an infinite loop

Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState).

error.multiple-validation-errors.ts:9:2
   7 |   // Multiple validation errors:
   8 |   const refValue = ref.current; // Error 1: ref access during render
>  9 |   setCount(count + 1); // Error 2: setState during render
     |   ^^^^^^^^ Found setState() in render
  10 |   
  11 |   
  12 |   useEffect(() => {if (count > 0) {
```
          
      