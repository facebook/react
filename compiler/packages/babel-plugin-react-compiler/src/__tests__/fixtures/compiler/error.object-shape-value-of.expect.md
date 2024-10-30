
## Input

```javascript
import {ValidateMemoization} from 'shared-runtime';

function Component() {
  const x = {
    valueOf() {
      return this;
    }
  };
  x.valueOf().y = true;

  return <ValidateMemoization inputs={[x]} output={x} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  sequentialRenders: [{}, {}],
};

```


## Error

```
  4 |   const x = {
  5 |     valueOf() {
> 6 |       return this;
    |              ^^^^ Todo: (BuildHIR::lowerExpression) Handle ThisExpression expressions (6:6)
  7 |     }
  8 |   };
  9 |   x.valueOf().y = true;
```
          
      