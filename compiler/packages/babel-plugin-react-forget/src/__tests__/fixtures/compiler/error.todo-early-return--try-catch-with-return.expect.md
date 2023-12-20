
## Input

```javascript
const { shallowCopy, throwInput } = require("shared-runtime");

// @debug
function Component(props) {
  let x = [];
  try {
    const y = shallowCopy({});
    if (y == null) {
      return;
    }
    x.push(throwInput(y));
  } catch {
    return null;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```


## Error

```
[ReactForget] Todo: Support early return within a reactive scope
```
          
      