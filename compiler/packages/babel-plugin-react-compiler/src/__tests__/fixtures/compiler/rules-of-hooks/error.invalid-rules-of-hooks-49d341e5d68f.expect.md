
## Input

```javascript
// Expected to fail

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function useLabeledBlock() {
  label: {
    if (a) break label;
    useHook();
  }
}

```


## Error

```
   6 |   label: {
   7 |     if (a) break label;
>  8 |     useHook();
     |     ^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (8:8)
   9 |   }
  10 | }
  11 |
```
          
      