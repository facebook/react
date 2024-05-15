
## Input

```javascript
// Expected to fail

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function ComponentWithTernaryHook() {
  cond ? useTernaryHook() : null;
}

```


## Error

```
  4 | // This *must* be invalid.
  5 | function ComponentWithTernaryHook() {
> 6 |   cond ? useTernaryHook() : null;
    |          ^^^^^^^^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (6:6)
  7 | }
  8 |
```
          
      