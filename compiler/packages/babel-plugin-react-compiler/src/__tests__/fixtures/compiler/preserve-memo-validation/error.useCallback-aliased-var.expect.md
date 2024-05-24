
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

// This is technically a false positive, but source is already breaking
// `exhaustive-deps` lint rule (and can be considered invalid).
function useHook(x) {
  const aliasedX = x;
  const aliasedProp = x.y.z;

  return useCallback(() => [aliasedX, x.y.z], [x, aliasedProp]);
}

```


## Error

```
   7 |   const aliasedProp = x.y.z;
   8 |
>  9 |   return useCallback(() => [aliasedX, x.y.z], [x, aliasedProp]);
     |                      ^^^^^^^^^^^^^^^^^^^^^^^ Invariant: Unexpected mismatch between StartMemoize and FinishMemoize. Encountered StartMemoize id=undefined followed by FinishMemoize id=0 (9:9)
  10 | }
  11 |
```
          
      