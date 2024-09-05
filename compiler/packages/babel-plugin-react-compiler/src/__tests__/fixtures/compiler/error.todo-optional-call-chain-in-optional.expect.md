
## Input

```javascript
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
  1 | function useFoo(props: {value: {x: string; y: string} | null}) {
  2 |   const value = props.value;
> 3 |   return createArray(value?.x, value?.y)?.join(', ');
    |                                ^^^^^^^^ Todo: Unexpected terminal kind `optional` for optional test block (3:3)
  4 | }
  5 |
  6 | function createArray<T>(...args: Array<T>): Array<T> {
```
          
      