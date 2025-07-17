
## Input

```javascript
function component(a, b) {
  let x = React.useMemo(async () => {
    await a;
  }, []);
  return x;
}

```


## Error

```
Found 1 error:
Error: useMemo callbacks may not be async or generator functions

error.invalid-ReactUseMemo-async-callback.ts:2:24
  1 | function component(a, b) {
> 2 |   let x = React.useMemo(async () => {
    |                         ^^^^^^^^^^^^^
> 3 |     await a;
    | ^^^^^^^^^^^^
> 4 |   }, []);
    | ^^^^ useMemo callbacks may not be async or generator functions
  5 |   return x;
  6 | }
  7 |


```
          
      