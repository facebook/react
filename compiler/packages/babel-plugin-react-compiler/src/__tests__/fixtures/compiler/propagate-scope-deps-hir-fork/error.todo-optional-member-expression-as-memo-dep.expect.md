
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies @enablePropagateDepsInHIR
function Component(props) {
  const data = useMemo(() => {
    return props?.items.edges?.nodes.map();
  }, [props?.items.edges?.nodes]);
  return <Foo data={data} />;
}

```


## Error

```
  1 | // @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies @enablePropagateDepsInHIR
  2 | function Component(props) {
> 3 |   const data = useMemo(() => {
    |                        ^^^^^^^
> 4 |     return props?.items.edges?.nodes.map();
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 5 |   }, [props?.items.edges?.nodes]);
    | ^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected (3:5)
  6 |   return <Foo data={data} />;
  7 | }
  8 |
```
          
      