
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
  3 | const SCALE = 2;
  4 | function Component(props) {
> 5 |   const {[props.name]: value} = props;
    |          ^^^^^^^^^^^^^^^^^^^ Todo: (BuildHIR::lowerAssignment) Handle computed properties in ObjectPattern (5:5)
  6 |   return value;
  7 | }
  8 |
```
          
      