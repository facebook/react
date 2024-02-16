
## Input

```javascript
// @compilationMode(infer)
function Component() {
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
   5 |       const y = {
   6 |         inner() {
>  7 |           return useFoo();
     |                  ^^^^^^ [ReactForget] InvalidReact: Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning). Cannot call Custom within a function component (7:7)
   8 |         },
   9 |       };
  10 |       return y;
```
          
      