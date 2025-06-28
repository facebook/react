
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
   7 |   const aliasedProp = x.y.z;
   8 |
>  9 |   return useMemo(() => [x, x.y.z], [aliasedX, aliasedProp]);
     |                  ^^^^^^^^^^^^^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `x`, but the source dependencies were [aliasedX, aliasedProp]. Inferred different dependency than source (9:9)
  10 | }
  11 |
```
          
      