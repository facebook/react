
## Input

```javascript
import {identity, mutate, mutateAndReturn} from 'shared-runtime';

function Component(props) {
  const obj = {mutateAndReturn};
  const key = {};
  const context = {
    [obj.mutateAndReturn(key)]: identity([props.value]),
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
   5 |   const key = {};
   6 |   const context = {
>  7 |     [obj.mutateAndReturn(key)]: identity([props.value]),
     |      ^^^^^^^^^^^^^^^^^^^^^^^^ Todo: (BuildHIR::lowerExpression) Expected Identifier, got CallExpression key in ObjectExpression (7:7)
   8 |   };
   9 |   mutate(key);
  10 |   return context;
```
          
      