
## Input

```javascript
// @compilationMode(infer)
function Component() {
  const f = () => {
    const x = {
      outer() {
        const g = () => {
          const y = {
            inner() {
              return useFoo();
            },
          };
          return y;
        };
      },
    };
    return x;
  };
}

```


## Error

```
   7 |           const y = {
   8 |             inner() {
>  9 |               return useFoo();
     |                      ^^^^^^ [ReactForget] InvalidReact: Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning). Cannot call Custom within a function component (9:9)
  10 |             },
  11 |           };
  12 |           return y;
```
          
      