
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
  const $ = useMemoCache(17);
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
  let allUrls;
  let onClick;
  if (c_1) {
    allUrls = [];

    const { media: t1, comments: t3, urls: t5 } = post;
    const c_5 = $[5] !== t1;
    let t2;
    if (c_5) {
      t2 = t1 === undefined ? null : t1;
      $[5] = t1;
      $[6] = t2;
    } else {
      t2 = $[6];
    }
    media = t2;
    const c_7 = $[7] !== t3;
    let t4;
    if (c_7) {
      t4 = t3 === undefined ? [] : t3;
      $[7] = t3;
      $[8] = t4;
    } else {
      t4 = $[8];
    }
    const comments = t4;
    const c_9 = $[9] !== t5;
    let t6;
    if (c_9) {
      t6 = t5 === undefined ? [] : t5;
      $[9] = t5;
      $[10] = t6;
    } else {
      t6 = $[10];
    }
    const urls = t6;
    const c_11 = $[11] !== comments.length;
    let t7;
    if (c_11) {
      t7 = (e) => {
        if (!comments.length) {
          return;
        }

        console.log(comments.length);
      };
      $[11] = comments.length;
      $[12] = t7;
    } else {
      t7 = $[12];
    }
    onClick = t7;

    allUrls.push(...urls);
    $[1] = post;
    $[2] = media;
    $[3] = allUrls;
    $[4] = onClick;
  } else {
    media = $[2];
    allUrls = $[3];
    onClick = $[4];
  }
  const c_13 = $[13] !== media;
  const c_14 = $[14] !== allUrls;
  const c_15 = $[15] !== onClick;
  let t8;
  if (c_13 || c_14 || c_15) {
    t8 = <Stringify media={media} allUrls={allUrls} onClick={onClick} />;
    $[13] = media;
    $[14] = allUrls;
    $[15] = onClick;
    $[16] = t8;
  } else {
    t8 = $[16];
  }
  return t8;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ post: {} }],
  isComponent: true,
};

```
      