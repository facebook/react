
## Input

```javascript
import {identity, mutate, mutateAndReturn} from 'shared-runtime';

function Component(props) {
  const key = {};
  const context = {
    [mutateAndReturn(key)]: identity([props.value]),
  };
  mutate(key);
  return context;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 42}],
};

```


## Error

```
  4 |   const key = {};
  5 |   const context = {
> 6 |     [mutateAndReturn(key)]: identity([props.value]),
    |      ^^^^^^^^^^^^^^^^^^^^ Todo: (BuildHIR::lowerExpression) Expected Identifier, got CallExpression key in ObjectExpression (6:6)
  7 |   };
  8 |   mutate(key);
  9 |   return context;
```
          
      