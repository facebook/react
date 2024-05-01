
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
import { c as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(8);
  const post = useFragment(graphql`...`, props.post);
  let media;
  let onClick;
  if ($[0] !== post) {
    const allUrls = [];

    const { media: t0, comments, urls } = post;
    media = t0;
    let t1;
    if ($[3] !== comments.length) {
      t1 = (e) => {
        if (!comments.length) {
          return;
        }

        console.log(comments.length);
      };
      $[3] = comments.length;
      $[4] = t1;
    } else {
      t1 = $[4];
    }
    onClick = t1;

    allUrls.push(...urls);
    $[0] = post;
    $[1] = media;
    $[2] = onClick;
  } else {
    media = $[1];
    onClick = $[2];
  }
  let t0;
  if ($[5] !== media || $[6] !== onClick) {
    t0 = <Media media={media} onClick={onClick} />;
    $[5] = media;
    $[6] = onClick;
    $[7] = t0;
  } else {
    t0 = $[7];
  }
  return t0;
}

```
      