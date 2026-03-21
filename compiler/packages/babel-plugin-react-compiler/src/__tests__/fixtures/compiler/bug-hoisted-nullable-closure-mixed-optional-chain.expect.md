
## Input

```javascript
import {Stringify} from 'shared-runtime';

/**
 * Bug: `user?.company.name` inside a closure — the compiler strips the `?.`
 * when computing cache keys, producing `user.company.name` which crashes
 * when user is null.
 *
 * Related: https://github.com/facebook/react/issues/34752
 */
function Component({user}: {user: {company: {name: string}} | null}) {
  const handleClick = () => {
    console.log(user?.company.name);
  };
  return <Stringify onClick={handleClick}>Click</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{user: {company: {name: 'Acme'}}}],
  sequentialRenders: [
    {user: {company: {name: 'Acme'}}},
    {user: {company: {name: 'Corp'}}},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

/**
 * Bug: `user?.company.name` inside a closure — the compiler strips the `?.`
 * when computing cache keys, producing `user.company.name` which crashes
 * when user is null.
 *
 * Related: https://github.com/facebook/react/issues/34752
 */
function Component(t0) {
  const $ = _c(2);
  const { user } = t0;
  let t1;
  if ($[0] !== user?.company?.name) {
    const handleClick = () => {
      console.log(user?.company.name);
    };
    t1 = <Stringify onClick={handleClick}>Click</Stringify>;
    $[0] = user?.company?.name;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ user: { company: { name: "Acme" } } }],
  sequentialRenders: [
    { user: { company: { name: "Acme" } } },
    { user: { company: { name: "Corp" } } },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"onClick":"[[ function params=0 ]]","children":"Click"}</div>
<div>{"onClick":"[[ function params=0 ]]","children":"Click"}</div>