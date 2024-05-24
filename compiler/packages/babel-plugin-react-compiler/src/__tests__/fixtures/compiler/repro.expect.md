
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(6);
  let baseVideos;
  let thumbnails;
  if ($[0] !== props.item) {
    thumbnails = [];
    const item = props.item;
    baseVideos = getBaseVideos(item);

    baseVideos.forEach((video) => {
      const baseVideo = video.hasBaseVideo;
      if (Boolean(baseVideo)) {
        thumbnails.push({ extraVideo: true });
      }
    });
    $[0] = props.item;
    $[1] = baseVideos;
    $[2] = thumbnails;
  } else {
    baseVideos = $[1];
    thumbnails = $[2];
  }
  let t0;
  if ($[3] !== baseVideos || $[4] !== thumbnails) {
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
      