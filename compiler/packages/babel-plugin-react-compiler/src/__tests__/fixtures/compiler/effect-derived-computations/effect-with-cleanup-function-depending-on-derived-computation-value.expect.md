
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly

import {useEffect, useState} from 'react';

function Component(file: File) {
  const [imageUrl, setImageUrl] = useState(null);

  /*
   * Cleaning up the variable or a source of the variable used to setState
   * inside the effect communicates that we always need to clean up something
   * which is a valid use case for useEffect. In which case we want to
   * avoid an throwing
   */
  useEffect(() => {
    const imageUrlPrepared = URL.createObjectURL(file);
    setImageUrl(imageUrlPrepared);
    return () => URL.revokeObjectURL(imageUrlPrepared);
  }, [file]);

  return <Image src={imageUrl} xstyle={styles.imageSizeLimits} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @loggerTestOnly

import { useEffect, useState } from "react";

function Component(file) {
  const $ = _c(5);
  const [imageUrl, setImageUrl] = useState(null);
  let t0;
  let t1;
  if ($[0] !== file) {
    t0 = () => {
      const imageUrlPrepared = URL.createObjectURL(file);
      setImageUrl(imageUrlPrepared);
      return () => URL.revokeObjectURL(imageUrlPrepared);
    };
    t1 = [file];
    $[0] = file;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  useEffect(t0, t1);
  let t2;
  if ($[3] !== imageUrl) {
    t2 = <Image src={imageUrl} xstyle={styles.imageSizeLimits} />;
    $[3] = imageUrl;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

```

## Logs

```
{"kind":"CompileSuccess","fnLoc":{"start":{"line":5,"column":0,"index":108},"end":{"line":21,"column":1,"index":700},"filename":"effect-with-cleanup-function-depending-on-derived-computation-value.ts"},"fnName":"Component","memoSlots":5,"memoBlocks":2,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented