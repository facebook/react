
## Input

```javascript
function Component(props) {
  const item = props.item;
  const thumbnails = [];
  const baseVideos = getBaseVideos(item);
  useMemo(() => {
    baseVideos.forEach((video) => {
      const baseVideo = video.hasBaseVideo;
      if (Boolean(baseVideo)) {
        thumbnails.push({ extraVideo: true });
      }
    });
  });
  return <FlatList baseVideos={baseVideos} items={thumbnails} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(6);
  const item = props.item;
  const c_0 = $[0] !== item;
  let baseVideos;
  let thumbnails;
  if (c_0) {
    thumbnails = [];
    baseVideos = getBaseVideos(item);

    baseVideos.forEach((video) => {
      const baseVideo = video.hasBaseVideo;
      if (Boolean(baseVideo)) {
        thumbnails.push({ extraVideo: true });
      }
    });
    $[0] = item;
    $[1] = baseVideos;
    $[2] = thumbnails;
  } else {
    baseVideos = $[1];
    thumbnails = $[2];
  }
  const c_3 = $[3] !== baseVideos;
  const c_4 = $[4] !== thumbnails;
  let t0;
  if (c_3 || c_4) {
    t0 = <FlatList baseVideos={baseVideos} items={thumbnails} />;
    $[3] = baseVideos;
    $[4] = thumbnails;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  return t0;
}

```
      