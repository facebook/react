
## Input

```javascript
function Component(props) {
  const x = makeObject();
  const user = useFragment(
    graphql`fragment Component_user on User { ... }`,
    props.user
  );
  const posts = user.timeline.posts.edges.nodes.map((node) => {
    x.y = true;
    return <Post post={node} />;
  });
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
  const $ = _c(1);
  const x = makeObject();
  const user = useFragment(
    graphql`fragment Component_user on User { ... }`,
    props.user,
  );
  const posts = user.timeline.posts.edges.nodes.map((node) => {
    x.y = true;
    return <Post post={node} />;
  });
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  posts.push(t0);
  const count = posts.length;
  foo(count);
  return <>{posts}</>;
}

```
      