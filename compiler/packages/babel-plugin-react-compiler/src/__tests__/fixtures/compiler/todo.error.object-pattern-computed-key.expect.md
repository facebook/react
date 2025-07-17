
## Input

```javascript
import {identity} from 'shared-runtime';

const SCALE = 2;
function Component(props) {
  const {[props.name]: value} = props;
  return value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{name: 'Sathya'}],
};

```


## Error

```
Found 1 error:

Todo: (BuildHIR::lowerAssignment) Handle computed properties in ObjectPattern

todo.error.object-pattern-computed-key.ts:5:9
  3 | const SCALE = 2;
  4 | function Component(props) {
> 5 |   const {[props.name]: value} = props;
    |          ^^^^^^^^^^^^^^^^^^^ (BuildHIR::lowerAssignment) Handle computed properties in ObjectPattern
  6 |   return value;
  7 | }
  8 |
```
          
      