
## Input

```javascript
function useHook(nodeID, condition) {
  const graph = useContext(GraphContext);
  const node = nodeID != null ? graph[nodeID] : null;

  // (2) Instead we can create a scope around the loop since the loop produces an escapinng value
  let value;
  for (const key of Object.keys(node?.fields ?? {})) {
    if (condition) {
      // (1) We currently create a scope just for this instruction, then later prune the scope because
      // it's inside a loop
      value = new Class(node.fields?.[field]);
      break;
    }
  }
  return value;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function useHook(nodeID, condition) {
  const $ = _c(4);
  const graph = useContext(GraphContext);
  const node = nodeID != null ? graph[nodeID] : null;

  let value;
  const t0 = Object.keys(node?.fields ?? {});
  if ($[0] !== condition || $[1] !== node || $[2] !== t0) {
    for (const key of t0) {
      if (condition) {
        value = new Class(node.fields?.[field]);
        break;
      }
    }
    $[0] = condition;
    $[1] = node;
    $[2] = t0;
    $[3] = value;
  } else {
    value = $[3];
  }
  return value;
}

```
      
### Eval output
(kind: exception) Fixture not implemented