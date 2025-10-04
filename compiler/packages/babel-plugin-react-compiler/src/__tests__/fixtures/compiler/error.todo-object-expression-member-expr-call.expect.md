
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
Found 1 error:

Todo: (BuildHIR::lowerExpression) Expected Identifier, got CallExpression key in ObjectExpression

error.todo-object-expression-member-expr-call.ts:7:5
   5 |   const key = {};
   6 |   const context = {
>  7 |     [obj.mutateAndReturn(key)]: identity([props.value]),
     |      ^^^^^^^^^^^^^^^^^^^^^^^^ (BuildHIR::lowerExpression) Expected Identifier, got CallExpression key in ObjectExpression
   8 |   };
   9 |   mutate(key);
  10 |   return context;
```
          
      