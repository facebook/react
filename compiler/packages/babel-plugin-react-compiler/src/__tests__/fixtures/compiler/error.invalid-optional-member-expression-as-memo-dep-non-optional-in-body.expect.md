
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
function Component(props) {
  const data = useMemo(() => {
    // actual code is non-optional
    return props.items.edges.nodes ?? [];
    // deps are optional
  }, [props.items?.edges?.nodes]);
  return <Foo data={data} />;
}

```


## Error

```
   1 | // @validatePreserveExistingMemoizationGuarantees
   2 | function Component(props) {
>  3 |   const data = useMemo(() => {
     |                        ^^^^^^^
>  4 |     // actual code is non-optional
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  5 |     return props.items.edges.nodes ?? [];
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  6 |     // deps are optional
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  7 |   }, [props.items?.edges?.nodes]);
     | ^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `props.items.edges.nodes`, but the source dependencies were [props.items?.edges?.nodes]. Inferred different dependency than source (3:7)
   8 |   return <Foo data={data} />;
   9 | }
  10 |
```
          
      