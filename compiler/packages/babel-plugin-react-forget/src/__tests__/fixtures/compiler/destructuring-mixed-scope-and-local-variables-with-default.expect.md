
## Input

```javascript
import { Stringify, graphql } from "shared-runtime";

function useFragment(_arg1, _arg2) {
  "use no forget";
  return {
    urls: ["url1", "url2", "url3"],
    comments: ["comment1"],
  };
}

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
  return <Stringify media={media} allUrls={allUrls} onClick={onClick} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ post: {} }],
  isComponent: true,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { Stringify, graphql } from "shared-runtime";

function useFragment(_arg1, _arg2) {
  "use no forget";
  return {
    urls: ["url1", "url2", "url3"],
    comments: ["comment1"],
  };
}

function Component(props) {
  const $ = useMemoCache(14);
  const post = useFragment(graphql`...`, props.post);
  let media;
  let allUrls;
  let onClick;
  if ($[0] !== post) {
    allUrls = [];

    const { media: t0, comments: t1, urls: t2 } = post;
    media = t0 === undefined ? null : t0;
    let t3;
    if ($[4] !== t1) {
      t3 = t1 === undefined ? [] : t1;
      $[4] = t1;
      $[5] = t3;
    } else {
      t3 = $[5];
    }
    const comments = t3;
    let t4;
    if ($[6] !== t2) {
      t4 = t2 === undefined ? [] : t2;
      $[6] = t2;
      $[7] = t4;
    } else {
      t4 = $[7];
    }
    const urls = t4;
    let t5;
    if ($[8] !== comments.length) {
      t5 = (e) => {
        if (!comments.length) {
          return;
        }

        console.log(comments.length);
      };
      $[8] = comments.length;
      $[9] = t5;
    } else {
      t5 = $[9];
    }
    onClick = t5;

    allUrls.push(...urls);
    $[0] = post;
    $[1] = media;
    $[2] = allUrls;
    $[3] = onClick;
  } else {
    media = $[1];
    allUrls = $[2];
    onClick = $[3];
  }
  let t0;
  if ($[10] !== media || $[11] !== allUrls || $[12] !== onClick) {
    t0 = <Stringify media={media} allUrls={allUrls} onClick={onClick} />;
    $[10] = media;
    $[11] = allUrls;
    $[12] = onClick;
    $[13] = t0;
  } else {
    t0 = $[13];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ post: {} }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>{"media":null,"allUrls":["url1","url2","url3"],"onClick":"[[ function params=1 ]]"}</div>