
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
    "$",
    "_c",
    "t0",
    "Symbol",
    "for"
  ],
  "sources": [
    "sourcemaps-simple.ts"
  ],
  "sourcesContent": [
    "// @sourceMaps\nexport const Button = () => {\n  return <button>Click me</button>;\n};\n"
  ],
  "mappings": "kDAAA;AACA,OAAO,MAAMA,MAAM,GAAGA,CAAA,YAAAC,CAAA,GAAAC,EAAA,QAAAC,EAAA,KAAAF,CAAA,QAAAG,MAAA,CAAAC,GAAA;IACbF,EAAA,UAAyB,CAAjB,QAAQ,EAAhB,MAAyB,EAAAF,CAAA,MAAAE,EAAA,SAAAA,EAAA,GAAAF,CAAA,YAAzBE,EAAyB,EACjC",
  "ignoreList": []
}
```
      
### Eval output
(kind: exception) Fixture not implemented