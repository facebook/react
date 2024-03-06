
## Input

```javascript
function App({ text, hasDeps }) {
  const resolvedText = useMemo(
    () => {
      return text.toUpperCase();
    },
    hasDeps ? null : [text] // should be DCE'd
  );
  return resolvedText;
}

export const FIXTURE_ENTRYPOINT = {
  fn: App,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function App(t25) {
  const $ = useMemoCache(2);
  const { text, hasDeps } = t25;

  hasDeps ? null : [text];
  let t0;
  let t1;
  if ($[0] !== text) {
    t1 = text.toUpperCase();
    $[0] = text;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  t0 = t1;
  const resolvedText = t0;
  return resolvedText;
}

export const FIXTURE_ENTRYPOINT = {
  fn: App,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      