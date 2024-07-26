
## Input

```javascript
import idx from 'idx';

function Component(props) {
  // the lambda should not be outlined
  const groupName = idx(props, _ => _.group.label);
  return <div>{groupName}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```


## Error

```
The second argument supplied to `idx` must be an arrow function. (This is an error on an internal node. Probably an internal error.)
```
          
      