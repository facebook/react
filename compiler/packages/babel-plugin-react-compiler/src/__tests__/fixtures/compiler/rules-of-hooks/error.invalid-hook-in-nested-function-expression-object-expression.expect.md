
## Input

```javascript
// @compilationMode:"infer"
function Component() {
  'use memo';
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
Found 1 error:

Error: Cannot call hooks within function expressions

Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

error.invalid-hook-in-nested-function-expression-object-expression.ts:10:21
   8 |           const y = {
   9 |             inner() {
> 10 |               return useFoo();
     |                      ^^^^^^ Cannot call hook within a function expression
  11 |             },
  12 |           };
  13 |           return y;
```
          
      