
## Input

```javascript
// @skip
// Unsupported input

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function useHook() {
  try {
    f();
    useState();
  } catch {}
}

```


## Error

```
   6 | function useHook() {
   7 |   try {
>  8 |     f();
     |     ^ Invariant: [Codegen] No value found for temporary. Value for 'mutate? $5[0:4]:TFunction' was not set in the codegen context (8:8)
   9 |     useState();
  10 |   } catch {}
  11 | }
```
          
      