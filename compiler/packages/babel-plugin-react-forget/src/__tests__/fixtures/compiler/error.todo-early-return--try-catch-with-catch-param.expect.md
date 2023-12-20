
## Input

```javascript
const { throwInput } = require("shared-runtime");

function Component(props) {
  let x = [];
  try {
    // foo could throw its argument...
    throwInput(x);
  } catch (e) {
    // ... in which case this could be mutating `x`!
    e.push(null);
    return e;
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
[ReactForget] Todo: Support early return within a reactive scope (11:11)
```
          
      