
## Input

```javascript
// @sourceMaps
export const Button = name => {
  const greeting = `Hello, ${name}`;
  return <button>{greeting}</button>;
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @sourceMaps
export const Button = (name) => {
  const $ = _c(2);
  const greeting = `Hello, ${name}`;
  let t0;
  if ($[0] !== greeting) {
    t0 = <button>{greeting}</button>;
    $[0] = greeting;
    $[1] = t0;
  } else {
    t0 = $[1];
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
    "name",
    "greeting",
    "t0"
  ],
  "sources": [
    "sourcemaps-simple.ts"
  ],
  "sourcesContent": [
    "// @sourceMaps\nexport const Button = name => {\n  const greeting = `Hello, ${name}`;\n  return <button>{greeting}</button>;\n};\n"
  ],
  "mappings": "kDAAA;AACA,OAAO,MAAMA,MAAM,GAAGA,CAAAC,IAAA,K;EACpB,M,WAAiBC,UAAUD,IAAI,EAAjB,C;SACP,OAA2B,CAAlBC,SAAO,CAAE,EAAlB,MAA2B,C,qDAA3BC,EAA2B,C,CACnC",
  "ignoreList": []
}
```
      
### Eval output
(kind: exception) Fixture not implemented