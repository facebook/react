
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
  const $ = useMemoCache(8);
  const post = useFragment(graphql`...`, props.post);
  const c_0 = $[0] !== post;
  let media;
  let onClick;
  if (c_0) {
    const allUrls = [];

    const { media: t85, comments, urls } = post;
    media = t85;
    const c_3 = $[3] !== comments.length;
    let t0;
    if (c_3) {
      t0 = (e) => {
        if (!comments.length) {
          return;
        }
        console.log(comments.length);
      };
      $[3] = comments.length;
      $[4] = t0;
    } else {
      t0 = $[4];
    }
    onClick = t0;
    allUrls.push(...urls);
    $[0] = post;
    $[1] = media;
    $[2] = onClick;
  } else {
    media = $[1];
    onClick = $[2];
  }
  const c_5 = $[5] !== media;
  const c_6 = $[6] !== onClick;
  let t1;
  if (c_5 || c_6) {
    t1 = <Media media={media} onClick={onClick} />;
    $[5] = media;
    $[6] = onClick;
    $[7] = t1;
  } else {
    t1 = $[7];
  }
  return t1;
}

```
      