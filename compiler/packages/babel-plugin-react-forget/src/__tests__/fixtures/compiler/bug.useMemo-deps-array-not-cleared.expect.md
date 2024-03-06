
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
function App(t0) {
  const $ = useMemoCache(2);
  const { text, hasDeps } = t0;

  hasDeps ? null : [text];
  let t1;
  let t2;
  if ($[0] !== text) {
    t2 = text.toUpperCase();
    $[0] = text;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  t1 = t2;
  const resolvedText = t1;
  return resolvedText;
}

export const FIXTURE_ENTRYPOINT = {
  fn: App,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      