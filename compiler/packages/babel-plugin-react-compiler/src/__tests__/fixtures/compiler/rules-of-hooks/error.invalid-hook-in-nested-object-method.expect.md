
## Input

```javascript
// @compilationMode(infer)
function Component() {
  'use memo';
  const x = {
    outer() {
      const y = {
        inner() {
          return useFoo();
        },
      };
      return y;
    },
  };
  return x;
}

```


## Error

```
   6 |       const y = {
   7 |         inner() {
>  8 |           return useFoo();
     |                  ^^^^^^ InvalidReact: Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning). Cannot call Custom within a function component (8:8)
   9 |         },
  10 |       };
  11 |       return y;
```
          
      