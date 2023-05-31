
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
  const { media = null, comments = [], urls = [] } = post;
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
  const $ = useMemoCache(12);
  const post = useFragment(graphql`...`, props.post);
  const c_0 = $[0] !== post;
  let media;
  let onClick;
  if (c_0) {
    const allUrls = [];

    const { media: t0, comments: t2, urls: t82 } = post;
    const c_3 = $[3] !== t0;
    let t1;
    if (c_3) {
      t1 = t0 === undefined ? null : t0;
      $[3] = t0;
      $[4] = t1;
    } else {
      t1 = $[4];
    }
    media = t1;
    const c_5 = $[5] !== t2;
    let t3;
    if (c_5) {
      t3 = t2 === undefined ? [] : t2;
      $[5] = t2;
      $[6] = t3;
    } else {
      t3 = $[6];
    }
    const comments = t3;
    const urls = t82 === undefined ? [] : t82;
    const c_7 = $[7] !== comments.length;
    let t4;
    if (c_7) {
      t4 = (e) => {
        if (!comments.length) {
          return;
        }
        console.log(comments.length);
      };
      $[7] = comments.length;
      $[8] = t4;
    } else {
      t4 = $[8];
    }
    onClick = t4;
    allUrls.push(...urls);
    $[0] = post;
    $[1] = media;
    $[2] = onClick;
  } else {
    media = $[1];
    onClick = $[2];
  }
  const c_9 = $[9] !== media;
  const c_10 = $[10] !== onClick;
  let t5;
  if (c_9 || c_10) {
    t5 = <Media media={media} onClick={onClick} />;
    $[9] = media;
    $[10] = onClick;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  return t5;
}

```
      