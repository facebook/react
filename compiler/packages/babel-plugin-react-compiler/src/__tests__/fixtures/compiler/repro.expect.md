
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
  const $ = _c(2);
  const item = props.item;
  let t0;
  if ($[0] !== item) {
    const thumbnails = [];
    const baseVideos = getBaseVideos(item);

    baseVideos.forEach((video) => {
      const baseVideo = video.hasBaseVideo;
      if (Boolean(baseVideo)) {
        thumbnails.push({ extraVideo: true });
      }
    });

    t0 = <FlatList baseVideos={baseVideos} items={thumbnails} />;
    $[0] = item;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      