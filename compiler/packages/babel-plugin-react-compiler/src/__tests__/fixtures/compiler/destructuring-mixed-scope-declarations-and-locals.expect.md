
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(5);
  const post = useFragment(graphql`...`, props.post);
  const allUrls = [];

  const { media, comments, urls } = post;
  let t0;
  if ($[0] !== comments.length) {
    t0 = (e) => {
      if (!comments.length) {
        return;
      }

      console.log(comments.length);
    };
    $[0] = comments.length;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onClick = t0;
  let t1;
  if ($[2] !== media || $[3] !== onClick) {
    t1 = <Media media={media} onClick={onClick} />;
    $[2] = media;
    $[3] = onClick;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  allUrls.push(...urls);
  return t1;
}

```
      