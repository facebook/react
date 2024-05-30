
## Input

```javascript
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(4);
  const user = useFragment(
    graphql`fragment Component_user on User { ... }`,
    props.user,
  );
  let t0;
  let t1;
  if ($[0] !== user.timeline.posts.edges.nodes) {
    const posts = user.timeline.posts.edges.nodes.map((node) => (
      <Post post={node} />
    ));

    t0 = posts;

    t1 = <>{posts}</>;
    let t2;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
      t2 = {};
      $[3] = t2;
    } else {
      t2 = $[3];
    }
    posts.push(t2);
    $[0] = user.timeline.posts.edges.nodes;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  const count = t0.length;
  foo(count);
  return t1;
}

```
      