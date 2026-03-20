
## Input

```javascript
import {Stringify} from 'shared-runtime';

/**
 * Bug: Optional chain `user?.name` in render + unconditional `user.email`
 * in closure. The closure's `user.email` makes the compiler think `user` is
 * non-null, converting the render's `user?.name` to `user.name` in cache keys.
 *
 * Related: https://github.com/facebook/react/issues/34752
 */
function Component({
  user,
}: {
  user: {name: string; email: string} | null;
}) {
  const sendEmail = () => {
    console.log(user.email);
  };
  return <Stringify onClick={sendEmail}>{user?.name}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{user: {name: 'Alice', email: 'alice@example.com'}}],
  sequentialRenders: [
    {user: {name: 'Alice', email: 'alice@example.com'}},
    {user: {name: 'Bob', email: 'bob@example.com'}},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

/**
 * Bug: Optional chain `user?.name` in render + unconditional `user.email`
 * in closure. The closure's `user.email` makes the compiler think `user` is
 * non-null, converting the render's `user?.name` to `user.name` in cache keys.
 *
 * Related: https://github.com/facebook/react/issues/34752
 */
function Component(t0) {
  const $ = _c(5);
  const { user } = t0;
  let t1;
  if ($[0] !== user) {
    t1 = () => {
      console.log(user.email);
    };
    $[0] = user;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const sendEmail = t1;

  const t2 = user?.name;
  let t3;
  if ($[2] !== sendEmail || $[3] !== t2) {
    t3 = <Stringify onClick={sendEmail}>{t2}</Stringify>;
    $[2] = sendEmail;
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ user: { name: "Alice", email: "alice@example.com" } }],
  sequentialRenders: [
    { user: { name: "Alice", email: "alice@example.com" } },
    { user: { name: "Bob", email: "bob@example.com" } },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"onClick":"[[ function params=0 ]]","children":"Alice"}</div>
<div>{"onClick":"[[ function params=0 ]]","children":"Bob"}</div>