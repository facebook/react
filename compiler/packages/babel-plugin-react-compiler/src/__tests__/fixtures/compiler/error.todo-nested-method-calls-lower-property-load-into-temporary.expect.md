
## Input

```javascript
import {makeArray} from 'shared-runtime';

function Component(props) {
  const items = makeArray(0, 1, 2, null, 4, false, 6);
  const max = Math.max(...items.filter(Boolean));
  return max;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```


## Error

```
  3 | function Component(props) {
  4 |   const items = makeArray(0, 1, 2, null, 4, false, 6);
> 5 |   const max = Math.max(...items.filter(Boolean));
    |               ^^^^^^^^ Invariant: [Codegen] Internal error: MethodCall::property must be an unpromoted + unmemoized MemberExpression. Got a `Identifier` (5:5)
  6 |   return max;
  7 | }
  8 |
```
          
      