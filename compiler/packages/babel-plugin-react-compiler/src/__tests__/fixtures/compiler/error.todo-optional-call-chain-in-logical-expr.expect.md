
## Input

```javascript
import {useNoAlias} from 'shared-runtime';

function useFoo(props: {value: {x: string; y: string} | null}) {
  const value = props.value;
  return useNoAlias(value?.x, value?.y) ?? {};
}

export const FIXTURE_ENTRYPONT = {
  fn: useFoo,
  props: [{value: null}],
};

```


## Error

```
Found 1 error:

Todo: Unexpected terminal kind `optional` for logical test block

error.todo-optional-call-chain-in-logical-expr.ts:5:30
  3 | function useFoo(props: {value: {x: string; y: string} | null}) {
  4 |   const value = props.value;
> 5 |   return useNoAlias(value?.x, value?.y) ?? {};
    |                               ^^^^^^^^ Unexpected terminal kind `optional` for logical test block
  6 | }
  7 |
  8 | export const FIXTURE_ENTRYPONT = {
```
          
      