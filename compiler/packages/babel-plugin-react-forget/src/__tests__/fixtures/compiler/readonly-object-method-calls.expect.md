
## Input

```javascript
// @enableNoAliasOptimizations
function Component(props) {
  const user = useFragment(
    graphql`fragment Component_user on User { ... }`,
    props.user
  );
  const posts = user.timeline.posts.edges.nodes.map((node) => (
    <Post post={node} />
  ));
  posts.push({});
  const count = posts.length;
  foo(count);
  return <>{posts}</>;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableNoAliasOptimizations
function Component(props) {
  const $ = useMemoCache(5);
  const user = useFragment(
    graphql`fragment Component_user on User { ... }`,
    props.user
  );
  const c_0 = $[0] !== user.timeline.posts.edges.nodes;
  let posts;
  if (c_0) {
    posts = user.timeline.posts.edges.nodes.map((node) => <Post post={node} />);
    let t0;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = {};
      $[2] = t0;
    } else {
      t0 = $[2];
    }
    posts.push(t0);
    $[0] = user.timeline.posts.edges.nodes;
    $[1] = posts;
  } else {
    posts = $[1];
  }
  const count = posts.length;
  foo(count);
  const c_3 = $[3] !== posts;
  let t1;
  if (c_3) {
    t1 = <>{posts}</>;
    $[3] = posts;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

```
      