
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

// This is technically a false positive, but source is already breaking
// `exhaustive-deps` lint rule (and can be considered invalid).
function useHook(x) {
  const aliasedX = x;
  const aliasedProp = x.y.z;

  return useMemo(() => [x, x.y.z], [aliasedX, aliasedProp]);
}

```


## Error

```
[ReactForget] Todo: Could not preserve manual memoization because an inferred dependency does not match the dependency list in source. The inferred dependency was `x`, but the source dependencies were [aliasedX, aliasedProp]
```
          
      