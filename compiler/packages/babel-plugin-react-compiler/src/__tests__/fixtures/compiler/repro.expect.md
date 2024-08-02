
## Input

```javascript
function Component(props) {
  const item = props.item;
  const thumbnails = [];
  const baseVideos = getBaseVideos(item);
  useMemo(() => {
    baseVideos.forEach(video => {
      const baseVideo = video.hasBaseVideo;
      if (Boolean(baseVideo)) {
        thumbnails.push({extraVideo: true});
      }
    });
  });
  return <FlatList baseVideos={baseVideos} items={thumbnails} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(7);
  const item = props.item;
  let t0;
  let baseVideos;
  let thumbnails;
  if ($[0] !== item) {
    thumbnails = [];
    baseVideos = getBaseVideos(item);

    baseVideos.forEach((video) => {
      const baseVideo = video.hasBaseVideo;
      if (Boolean(baseVideo)) {
        thumbnails.push({ extraVideo: true });
      }
    });
    $[0] = item;
    $[1] = t0;
    $[2] = baseVideos;
    $[3] = thumbnails;
  } else {
    t0 = $[1];
    baseVideos = $[2];
    thumbnails = $[3];
  }
  t0 = undefined;
  let t1;
  if ($[4] !== baseVideos || $[5] !== thumbnails) {
    t1 = <FlatList baseVideos={baseVideos} items={thumbnails} />;
    $[4] = baseVideos;
    $[5] = thumbnails;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
}

```
      