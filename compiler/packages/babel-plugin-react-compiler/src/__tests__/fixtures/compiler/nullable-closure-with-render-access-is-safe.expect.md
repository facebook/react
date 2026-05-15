
## Input

```javascript
import {Stringify} from 'shared-runtime';

/**
 * Correctness guard: When there is a render-time property access (user.name)
 * in the outer function body, it proves non-nullness at that point. The cache
 * key should remain `user.name` (non-optional). This fixture must NOT change
 * after the nullable-closure fix.
 */
function Component({user}: {user: {name: string}}) {
  const name = user.name;
  const handleClick = () => {
    console.log(user.name);
  };
  return <Stringify onClick={handleClick}>{name}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{user: {name: 'Alice'}}],
  sequentialRenders: [{user: {name: 'Alice'}}, {user: {name: 'Bob'}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

/**
 * Correctness guard: When there is a render-time property access (user.name)
 * in the outer function body, it proves non-nullness at that point. The cache
 * key should remain `user.name` (non-optional). This fixture must NOT change
 * after the nullable-closure fix.
 */
function Component(t0) {
  const $ = _c(5);
  const { user } = t0;
  const name = user.name;
  let t1;
  if ($[0] !== user.name) {
    t1 = () => {
      console.log(user.name);
    };
    $[0] = user.name;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handleClick = t1;
  let t2;
  if ($[2] !== handleClick || $[3] !== name) {
    t2 = <Stringify onClick={handleClick}>{name}</Stringify>;
    $[2] = handleClick;
    $[3] = name;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ user: { name: "Alice" } }],
  sequentialRenders: [{ user: { name: "Alice" } }, { user: { name: "Bob" } }],
};

```
      
### Eval output
(kind: ok) <div>{"onClick":"[[ function params=0 ]]","children":"Alice"}</div>
<div>{"onClick":"[[ function params=0 ]]","children":"Bob"}</div>