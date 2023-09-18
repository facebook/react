
## Input

```javascript
function Component(props) {
  const post = useFragment(graphql`...`, props.post);
  const allUrls = [];
  // `media` and `urls` are exported from the scope that will wrap this code,
  // but `comments` is not (it doesn't need to be memoized, bc the callback
  // only checks `comments.length`)
  // because of the scope, the let declaration for media and urls are lifted
  // out of the scope, and the destructure statement ends up turning into
  // a reassignment, instead of a const declaration. this means we try to
  // reassign `comments` when there's no declaration for it.
  const { media, comments, urls } = post;
  const onClick = (e) => {
    if (!comments.length) {
      return;
    }
    console.log(comments.length);
  };
  allUrls.push(...urls);
  return <Media media={media} onClick={onClick} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(9);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = graphql`...`;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const post = useFragment(t0, props.post);
  const c_1 = $[1] !== post;
  let media;
  let onClick;
  if (c_1) {
    const allUrls = [];

    const { media: t83, comments, urls } = post;
    media = t83;
    const c_4 = $[4] !== comments.length;
    let t1;
    if (c_4) {
      t1 = (e) => {
        if (!comments.length) {
          return;
        }

        console.log(comments.length);
      };
      $[4] = comments.length;
      $[5] = t1;
    } else {
      t1 = $[5];
    }
    onClick = t1;

    allUrls.push(...urls);
    $[1] = post;
    $[2] = media;
    $[3] = onClick;
  } else {
    media = $[2];
    onClick = $[3];
  }
  const c_6 = $[6] !== media;
  const c_7 = $[7] !== onClick;
  let t2;
  if (c_6 || c_7) {
    t2 = <Media media={media} onClick={onClick} />;
    $[6] = media;
    $[7] = onClick;
    $[8] = t2;
  } else {
    t2 = $[8];
  }
  return t2;
}

```
      