
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

import {useMemo} from 'react';
import {makeArray} from 'shared-runtime';

// We currently only recognize "hoistable" values (e.g. variable reads
// and property loads from named variables) in the source depslist.
// This makes validation logic simpler and follows the same constraints
// from the eslint react-hooks-deps plugin.
function Foo(props) {
  const x = makeArray(props);
  // react-hooks-deps lint would already fail here
  return useMemo(() => [x[0]], [x[0]]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{val: 1}],
};

```


## Error

```
  11 |   const x = makeArray(props);
  12 |   // react-hooks-deps lint would already fail here
> 13 |   return useMemo(() => [x[0]], [x[0]]);
     |                                 ^^^^ InvalidReact: Expected the dependency list to be an array of simple expressions (e.g. `x`, `x.y.z`, `x?.y?.z`) (13:13)
  14 | }
  15 |
  16 | export const FIXTURE_ENTRYPOINT = {
```
          
      