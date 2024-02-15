
## Input

```javascript
// Expected to fail

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function useHook({ bar }) {
  let foo1 = bar && useState();
  let foo2 = bar || useState();
  let foo3 = bar ?? useState();
}

```


## Error

```
  4 | // This *must* be invalid.
  5 | function useHook({ bar }) {
> 6 |   let foo1 = bar && useState();
    |                     ^^^^^^^^ [ReactForget] InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (6:6)

[ReactForget] InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (7:7)

[ReactForget] InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (8:8)
  7 |   let foo2 = bar || useState();
  8 |   let foo3 = bar ?? useState();
  9 | }
```
          
      