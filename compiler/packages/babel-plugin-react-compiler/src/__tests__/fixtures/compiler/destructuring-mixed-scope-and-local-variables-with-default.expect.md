
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
import { c as _c } from "react/compiler-runtime";
import { Stringify, graphql } from "shared-runtime";

function useFragment(_arg1, _arg2) {
  "use no forget";
  return {
    urls: ["url1", "url2", "url3"],
    comments: ["comment1"],
  };
}

function Component(props) {
  const $ = _c(15);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = graphql`...`;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const post = useFragment(t0, props.post);
  let media;
  let allUrls;
  let onClick;
  if ($[1] !== post) {
    allUrls = [];

    const { media: t1, comments: t2, urls: t3 } = post;
    media = t1 === undefined ? null : t1;
    let t4;
    if ($[5] !== t2) {
      t4 = t2 === undefined ? [] : t2;
      $[5] = t2;
      $[6] = t4;
    } else {
      t4 = $[6];
    }
    const comments = t4;
    let t5;
    if ($[7] !== t3) {
      t5 = t3 === undefined ? [] : t3;
      $[7] = t3;
      $[8] = t5;
    } else {
      t5 = $[8];
    }
    const urls = t5;
    let t6;
    if ($[9] !== comments.length) {
      t6 = (e) => {
        if (!comments.length) {
          return;
        }

        console.log(comments.length);
      };
      $[9] = comments.length;
      $[10] = t6;
    } else {
      t6 = $[10];
    }
    onClick = t6;

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
  let t1;
  if ($[11] !== media || $[12] !== allUrls || $[13] !== onClick) {
    t1 = <Stringify media={media} allUrls={allUrls} onClick={onClick} />;
    $[11] = media;
    $[12] = allUrls;
    $[13] = onClick;
    $[14] = t1;
  } else {
    t1 = $[14];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ post: {} }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>{"media":null,"allUrls":["url1","url2","url3"],"onClick":"[[ function params=1 ]]"}</div>