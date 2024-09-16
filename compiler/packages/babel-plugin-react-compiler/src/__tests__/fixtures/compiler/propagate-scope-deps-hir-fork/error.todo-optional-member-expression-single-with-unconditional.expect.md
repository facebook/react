
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies @enablePropagateDepsInHIR
import {ValidateMemoization} from 'shared-runtime';
function Component(props) {
  const data = useMemo(() => {
    const x = [];
    x.push(props?.items);
    x.push(props.items);
    return x;
  }, [props.items]);
  return <ValidateMemoization inputs={[props.items]} output={data} />;
}

```


## Error

```
   2 | import {ValidateMemoization} from 'shared-runtime';
   3 | function Component(props) {
>  4 |   const data = useMemo(() => {
     |                        ^^^^^^^
>  5 |     const x = [];
     | ^^^^^^^^^^^^^^^^^
>  6 |     x.push(props?.items);
     | ^^^^^^^^^^^^^^^^^
>  7 |     x.push(props.items);
     | ^^^^^^^^^^^^^^^^^
>  8 |     return x;
     | ^^^^^^^^^^^^^^^^^
>  9 |   }, [props.items]);
     | ^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected (4:9)
  10 |   return <ValidateMemoization inputs={[props.items]} output={data} />;
  11 | }
  12 |
```
          
      