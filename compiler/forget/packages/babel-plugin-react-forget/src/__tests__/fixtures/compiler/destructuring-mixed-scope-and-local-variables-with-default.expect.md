
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
  const $ = useMemoCache(16);
  const post = useFragment(graphql`...`, props.post);
  const c_0 = $[0] !== post;
  let media;
  let allUrls;
  let onClick;
  if (c_0) {
    allUrls = [];

    const { media: t0, comments: t2, urls: t4 } = post;
    const c_4 = $[4] !== t0;
    let t1;
    if (c_4) {
      t1 = t0 === undefined ? null : t0;
      $[4] = t0;
      $[5] = t1;
    } else {
      t1 = $[5];
    }
    media = t1;
    const c_6 = $[6] !== t2;
    let t3;
    if (c_6) {
      t3 = t2 === undefined ? [] : t2;
      $[6] = t2;
      $[7] = t3;
    } else {
      t3 = $[7];
    }
    const comments = t3;
    const c_8 = $[8] !== t4;
    let t5;
    if (c_8) {
      t5 = t4 === undefined ? [] : t4;
      $[8] = t4;
      $[9] = t5;
    } else {
      t5 = $[9];
    }
    const urls = t5;
    const c_10 = $[10] !== comments.length;
    let t6;
    if (c_10) {
      t6 = (e) => {
        if (!comments.length) {
          return;
        }

        console.log(comments.length);
      };
      $[10] = comments.length;
      $[11] = t6;
    } else {
      t6 = $[11];
    }
    onClick = t6;

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
  const c_12 = $[12] !== media;
  const c_13 = $[13] !== allUrls;
  const c_14 = $[14] !== onClick;
  let t7;
  if (c_12 || c_13 || c_14) {
    t7 = <Stringify media={media} allUrls={allUrls} onClick={onClick} />;
    $[12] = media;
    $[13] = allUrls;
    $[14] = onClick;
    $[15] = t7;
  } else {
    t7 = $[15];
  }
  return t7;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ post: {} }],
  isComponent: true,
};

```
      