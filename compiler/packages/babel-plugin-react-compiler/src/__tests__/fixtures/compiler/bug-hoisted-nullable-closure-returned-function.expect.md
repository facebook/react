
## Input

```javascript
import {createHookWrapper} from 'shared-runtime';

/**
 * Bug: Returned function accessing nullable prop. The compiler classifies
 * returned functions as "assumed invoked" and hoists `item.id` as a cache
 * key that crashes when item is null.
 *
 * Related: https://github.com/facebook/react/issues/35762
 */
function useHandler({item}: {item: {id: string} | null}) {
  const handler = () => {
    console.log(item.id);
  };
  return handler;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHandler),
  params: [{item: {id: 'abc'}}],
  sequentialRenders: [{item: {id: 'abc'}}, {item: {id: 'def'}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { createHookWrapper } from "shared-runtime";

/**
 * Bug: Returned function accessing nullable prop. The compiler classifies
 * returned functions as "assumed invoked" and hoists `item.id` as a cache
 * key that crashes when item is null.
 *
 * Related: https://github.com/facebook/react/issues/35762
 */
function useHandler(t0) {
  const $ = _c(2);
  const { item } = t0;
  let t1;
  if ($[0] !== item?.id) {
    t1 = () => {
      console.log(item.id);
    };
    $[0] = item?.id;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handler = t1;

  return handler;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHandler),
  params: [{ item: { id: "abc" } }],
  sequentialRenders: [{ item: { id: "abc" } }, { item: { id: "def" } }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"kind":"Function"},"shouldInvokeFns":true}</div>
<div>{"result":{"kind":"Function"},"shouldInvokeFns":true}</div>
logs: ['abc','def']