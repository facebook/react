
## Input

```javascript
import fbt from 'fbt';
/**
 * See comment in MergeOverlapping (changes MergeOverlapping and InferScope ->
 * don't count primitives)
 */
function CometAdsSideFeedUnit({adsSideFeedUnit}) {
  let adNodes = adsSideFeedUnit.nodes;
  adNodes = adNodes.slice(0, 2);

  const adNodesLength = adNodes.length;

  return adNodes.mmap(i => {
    return <Item hasBottomDivider={i !== adNodesLength - 1} />;
  });
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import fbt from "fbt";
/**
 * See comment in MergeOverlapping (changes MergeOverlapping and InferScope ->
 * don't count primitives)
 */
function CometAdsSideFeedUnit(t0) {
  const $ = _c(5);
  const { adsSideFeedUnit } = t0;
  let adNodes = adsSideFeedUnit.nodes;
  let t1;
  if ($[0] !== adNodes) {
    adNodes = adNodes.slice(0, 2);

    const adNodesLength = adNodes.length;
    let t2;
    if ($[3] !== adNodesLength) {
      t2 = (i) => <Item hasBottomDivider={i !== adNodesLength - 1} />;
      $[3] = adNodesLength;
      $[4] = t2;
    } else {
      t2 = $[4];
    }
    t1 = adNodes.mmap(t2);
    $[0] = adNodes;
    $[1] = t1;
    $[2] = adNodes;
  } else {
    t1 = $[1];
    adNodes = $[2];
  }
  return t1;
}

```
      
### Eval output
(kind: exception) Fixture not implemented