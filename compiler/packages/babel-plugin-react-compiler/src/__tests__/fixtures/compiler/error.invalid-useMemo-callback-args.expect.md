
## Input

```javascript
function component(a, b) {
  let x = useMemo(c => a, []);
  return x;
}

```


## Error

```
Found 1 error:

Error: useMemo() callbacks may not accept parameters

useMemo() callbacks are called by React to cache calculations across re-renders. They should not take parameters. Instead, directly reference the props, state, or local variables needed for the computation.

error.invalid-useMemo-callback-args.ts:2:18
  1 | function component(a, b) {
> 2 |   let x = useMemo(c => a, []);
    |                   ^ Callbacks with parameters are not supported
  3 |   return x;
  4 | }
  5 |
```
          
      