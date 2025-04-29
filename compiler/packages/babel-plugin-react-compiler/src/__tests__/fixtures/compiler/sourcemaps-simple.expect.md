
## Input

```javascript
// @sourceMaps
export const Button = () => {
  return <button>Click me</button>;
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @sourceMaps
export const Button = () => {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <button>Click me</button>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
};

```

## Source Map

```
{
  "version": 3,
  "names": [
    "Button",
    "t0"
  ],
  "sources": [
    "sourcemaps-simple.ts"
  ],
  "sourcesContent": [
    "// @sourceMaps\nexport const Button = () => {\n  return <button>Click me</button>;\n};\n"
  ],
  "mappings": "kDAAA;AACA,OAAO,MAAMA,MAAM,GAAGA,CAAA,K;SACb,OAAyB,CAAjB,QAAQ,EAAhB,MAAyB,C,qCAAzBC,EAAyB,C,CACjC",
  "ignoreList": []
}
```
      
### Eval output
(kind: exception) Fixture not implemented