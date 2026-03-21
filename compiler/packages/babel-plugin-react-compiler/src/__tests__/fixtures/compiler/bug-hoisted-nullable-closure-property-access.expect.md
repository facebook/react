
## Input

```javascript
import {Stringify} from 'shared-runtime';

/**
 * Bug: The compiler hoists `user.name` from the onClick closure into a cache
 * key check that runs during render. When `user` is null, this crashes with
 * TypeError even though the source code guards with an early return.
 *
 * The compiled output should use `user?.name` (optional) in the cache key,
 * not `user.name` (non-optional).
 *
 * Related: https://github.com/facebook/react/issues/35762
 */
function Component({user}: {user: {name: string} | null}) {
  const handleClick = () => {
    console.log(user.name);
  };
  if (!user) return null;
  return <Stringify onClick={handleClick}>{user.name}</Stringify>;
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
 * Bug: The compiler hoists `user.name` from the onClick closure into a cache
 * key check that runs during render. When `user` is null, this crashes with
 * TypeError even though the source code guards with an early return.
 *
 * The compiled output should use `user?.name` (optional) in the cache key,
 * not `user.name` (non-optional).
 *
 * Related: https://github.com/facebook/react/issues/35762
 */
function Component(t0) {
  const $ = _c(5);
  const { user } = t0;
  let t1;
  if ($[0] !== user?.name) {
    t1 = () => {
      console.log(user.name);
    };
    $[0] = user?.name;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handleClick = t1;

  if (!user) {
    return null;
  }
  let t2;
  if ($[2] !== handleClick || $[3] !== user.name) {
    t2 = <Stringify onClick={handleClick}>{user.name}</Stringify>;
    $[2] = handleClick;
    $[3] = user.name;
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