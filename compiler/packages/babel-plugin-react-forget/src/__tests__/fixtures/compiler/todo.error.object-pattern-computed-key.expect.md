
## Input

```javascript
import { identity } from "shared-runtime";

const SCALE = 2;
function Component(props) {
  const { [props.name]: value } = props;
  return value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ name: "Sathya" }],
};

```


## Error

```
[ReactForget] Todo: (BuildHIR::lowerAssignment) Handle computed properties in ObjectPattern (5:5)
```
          
      