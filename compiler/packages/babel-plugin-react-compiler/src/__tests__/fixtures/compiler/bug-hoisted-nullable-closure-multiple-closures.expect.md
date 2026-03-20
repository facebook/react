
## Input

```javascript
import {Stringify} from 'shared-runtime';

/**
 * Bug: Multiple closures accessing different nullable props. Both `user.name`
 * and `post.title` are hoisted as cache keys that crash when either is null.
 *
 * Related: https://github.com/facebook/react/issues/35762
 */
function Component({
  user,
  post,
}: {
  user: {name: string} | null;
  post: {title: string} | null;
}) {
  const handleUser = () => {
    console.log(user.name);
  };
  const handlePost = () => {
    console.log(post.title);
  };
  if (!user || !post) return null;
  return (
    <Stringify onUser={handleUser} onPost={handlePost}>
      {user.name}
      {post.title}
    </Stringify>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{user: {name: 'Alice'}, post: {title: 'Hello'}}],
  sequentialRenders: [
    {user: {name: 'Alice'}, post: {title: 'Hello'}},
    {user: {name: 'Bob'}, post: {title: 'World'}},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

/**
 * Bug: Multiple closures accessing different nullable props. Both `user.name`
 * and `post.title` are hoisted as cache keys that crash when either is null.
 *
 * Related: https://github.com/facebook/react/issues/35762
 */
function Component(t0) {
  const $ = _c(9);
  const { user, post } = t0;
  let t1;
  if ($[0] !== user) {
    t1 = () => {
      console.log(user.name);
    };
    $[0] = user;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handleUser = t1;
  let t2;
  if ($[2] !== post) {
    t2 = () => {
      console.log(post.title);
    };
    $[2] = post;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const handlePost = t2;

  if (!user || !post) {
    return null;
  }
  let t3;
  if (
    $[4] !== handlePost ||
    $[5] !== handleUser ||
    $[6] !== post.title ||
    $[7] !== user.name
  ) {
    t3 = (
      <Stringify onUser={handleUser} onPost={handlePost}>
        {user.name}
        {post.title}
      </Stringify>
    );
    $[4] = handlePost;
    $[5] = handleUser;
    $[6] = post.title;
    $[7] = user.name;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ user: { name: "Alice" }, post: { title: "Hello" } }],
  sequentialRenders: [
    { user: { name: "Alice" }, post: { title: "Hello" } },
    { user: { name: "Bob" }, post: { title: "World" } },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"onUser":"[[ function params=0 ]]","onPost":"[[ function params=0 ]]","children":["Alice","Hello"]}</div>
<div>{"onUser":"[[ function params=0 ]]","onPost":"[[ function params=0 ]]","children":["Bob","World"]}</div>