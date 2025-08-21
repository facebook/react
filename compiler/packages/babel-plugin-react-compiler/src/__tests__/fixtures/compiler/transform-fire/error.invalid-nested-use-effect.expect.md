
## Input

```javascript
// @enable
import {fire} from 'react';

function Component(props) {
  const foo = props => {
    console.log(props);
  };
  useEffect(() => {
    useEffect(() => {
      function nested() {
        fire(foo(props));
      }

      nested();
    });
  });

  return null;
}

```


## Error

```
Found 1 error:

Error: Cannot call hooks within function expressions

Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

error.invalid-nested-use-effect.ts:9:4
   7 |   };
   8 |   useEffect(() => {
>  9 |     useEffect(() => {
     |     ^^^^^^^^^ Cannot call useEffect within a function expression
  10 |       function nested() {
  11 |         fire(foo(props));
  12 |       }
```
          
      