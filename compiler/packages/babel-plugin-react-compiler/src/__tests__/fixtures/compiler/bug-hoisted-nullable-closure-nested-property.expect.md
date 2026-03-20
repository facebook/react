
## Input

```javascript
import {Stringify} from 'shared-runtime';

/**
 * Bug: Deep property access on nullable base inside closure. The compiler
 * hoists `post.author.profile.avatar` as a cache key that crashes when
 * post is null, even though the early return guard prevents rendering.
 *
 * Related: https://github.com/facebook/react/issues/35762
 */
function Component({
  post,
}: {
  post: {author: {profile: {avatar: string}}} | null;
}) {
  const handleClick = () => {
    console.log(post.author.profile.avatar);
  };
  if (!post) return null;
  return (
    <Stringify onClick={handleClick}>{post.author.profile.avatar}</Stringify>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{post: {author: {profile: {avatar: 'pic.jpg'}}}}],
  sequentialRenders: [
    {post: {author: {profile: {avatar: 'pic.jpg'}}}},
    {post: {author: {profile: {avatar: 'new.jpg'}}}},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

/**
 * Bug: Deep property access on nullable base inside closure. The compiler
 * hoists `post.author.profile.avatar` as a cache key that crashes when
 * post is null, even though the early return guard prevents rendering.
 *
 * Related: https://github.com/facebook/react/issues/35762
 */
function Component(t0) {
  const $ = _c(5);
  const { post } = t0;
  let t1;
  if ($[0] !== post) {
    t1 = () => {
      console.log(post.author.profile.avatar);
    };
    $[0] = post;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handleClick = t1;

  if (!post) {
    return null;
  }
  let t2;
  if ($[2] !== handleClick || $[3] !== post.author.profile.avatar) {
    t2 = (
      <Stringify onClick={handleClick}>{post.author.profile.avatar}</Stringify>
    );
    $[2] = handleClick;
    $[3] = post.author.profile.avatar;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ post: { author: { profile: { avatar: "pic.jpg" } } } }],
  sequentialRenders: [
    { post: { author: { profile: { avatar: "pic.jpg" } } } },
    { post: { author: { profile: { avatar: "new.jpg" } } } },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"onClick":"[[ function params=0 ]]","children":"pic.jpg"}</div>
<div>{"onClick":"[[ function params=0 ]]","children":"new.jpg"}</div>