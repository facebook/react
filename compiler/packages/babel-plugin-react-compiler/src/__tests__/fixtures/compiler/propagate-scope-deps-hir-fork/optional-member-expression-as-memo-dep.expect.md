
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies @enablePropagateDepsInHIR
function Component(props) {
  const data = useMemo(() => {
    return props?.items.edges?.nodes.map();
  }, [props?.items.edges?.nodes]);
  return <Foo data={data} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies @enablePropagateDepsInHIR
function Component(props) {
  const $ = _c(4);

  props?.items.edges?.nodes;
  let t0;
  let t1;
  if ($[0] !== props?.items.edges?.nodes) {
    t1 = props?.items.edges?.nodes.map();
    $[0] = props?.items.edges?.nodes;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  t0 = t1;
  const data = t0;
  let t2;
  if ($[2] !== data) {
    t2 = <Foo data={data} />;
    $[2] = data;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

```
      
### Eval output
(kind: exception) Fixture not implemented