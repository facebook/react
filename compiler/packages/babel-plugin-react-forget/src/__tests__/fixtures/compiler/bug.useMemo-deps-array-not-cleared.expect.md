
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
function App(t23) {
  const $ = useMemoCache(2);
  const { text, hasDeps } = t23;

  hasDeps ? null : [text];
  let t44;
  const c_0 = $[0] !== text;
  let t0;
  if (c_0) {
    t0 = text.toUpperCase();
    $[0] = text;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  t44 = t0;
  const resolvedText = t44;
  return resolvedText;
}

export const FIXTURE_ENTRYPOINT = {
  fn: App,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      