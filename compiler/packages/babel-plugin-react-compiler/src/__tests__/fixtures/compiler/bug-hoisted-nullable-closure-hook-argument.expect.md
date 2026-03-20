
## Input

```javascript
import {Stringify, useIdentity} from 'shared-runtime';

/**
 * Bug: Function passed as argument to a custom hook. The compiler assumes
 * hook arguments are invoked and hoists `item.id` from the closure into
 * a cache key that crashes when item is null.
 *
 * Related: https://github.com/facebook/react/issues/34194
 */
function Component({item}: {item: {id: string} | null}) {
  const processItem = () => {
    return item.id;
  };
  useIdentity(processItem);
  if (!item) return null;
  return <Stringify>{item.id}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{item: {id: 'abc'}}],
  sequentialRenders: [{item: {id: 'abc'}}, {item: {id: 'def'}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify, useIdentity } from "shared-runtime";

/**
 * Bug: Function passed as argument to a custom hook. The compiler assumes
 * hook arguments are invoked and hoists `item.id` from the closure into
 * a cache key that crashes when item is null.
 *
 * Related: https://github.com/facebook/react/issues/34194
 */
function Component(t0) {
  const $ = _c(4);
  const { item } = t0;
  let t1;
  if ($[0] !== item) {
    t1 = () => item.id;
    $[0] = item;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const processItem = t1;

  useIdentity(processItem);
  if (!item) {
    return null;
  }
  let t2;
  if ($[2] !== item.id) {
    t2 = <Stringify>{item.id}</Stringify>;
    $[2] = item.id;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ item: { id: "abc" } }],
  sequentialRenders: [{ item: { id: "abc" } }, { item: { id: "def" } }],
};

```
      
### Eval output
(kind: ok) <div>{"children":"abc"}</div>
<div>{"children":"def"}</div>