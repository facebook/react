
## Input

```javascript
// @enablePropagateDepsInHIR
function useFoo(props: {value: {x: string; y: string} | null}) {
  const value = props.value;
  return createArray(value?.x, value?.y)?.join(', ');
}

function createArray<T>(...args: Array<T>): Array<T> {
  return args;
}

export const FIXTURE_ENTRYPONT = {
  fn: useFoo,
  props: [{value: null}],
};

```


## Error

```
  2 | function useFoo(props: {value: {x: string; y: string} | null}) {
  3 |   const value = props.value;
> 4 |   return createArray(value?.x, value?.y)?.join(', ');
    |                                ^^^^^^^^ Todo: Unexpected terminal kind `optional` for optional test block (4:4)
  5 | }
  6 |
  7 | function createArray<T>(...args: Array<T>): Array<T> {
```
          
      