
## Input

```javascript
import {useIdentity} from 'shared-runtime';

function Component() {
  const items = makeArray(0, 1, 2, null, 4, false, 6);
  return useIdentity(...items.values());
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  sequentialRenders: [{}, {}],
};

```


## Error

```
  3 | function Component() {
  4 |   const items = makeArray(0, 1, 2, null, 4, false, 6);
> 5 |   return useIdentity(...items.values());
    |                         ^^^^^^^^^^^^^^ Todo: Support spread syntax for hook arguments (5:5)
  6 | }
  7 |
  8 | export const FIXTURE_ENTRYPOINT = {
```
          
      