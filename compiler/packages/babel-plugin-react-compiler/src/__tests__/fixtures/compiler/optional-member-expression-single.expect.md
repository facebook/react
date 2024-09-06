
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies @enablePropagateDepsInHIR:false
import {ValidateMemoization} from 'shared-runtime';
function Component(props) {
  const data = useMemo(() => {
    const x = [];
    x.push(props?.items);
    return x;
  }, [props?.items]);
  return <ValidateMemoization inputs={[props?.items]} output={data} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies @enablePropagateDepsInHIR:false
import { ValidateMemoization } from "shared-runtime";
function Component(props) {
  const $ = _c(7);

  props?.items;
  let t0;
  let x;
  if ($[0] !== props?.items) {
    x = [];
    x.push(props?.items);
    $[0] = props?.items;
    $[1] = x;
  } else {
    x = $[1];
  }
  t0 = x;
  const data = t0;
  const t1 = props?.items;
  let t2;
  if ($[2] !== t1) {
    t2 = [t1];
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t2 || $[5] !== data) {
    t3 = <ValidateMemoization inputs={t2} output={data} />;
    $[4] = t2;
    $[5] = data;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

```
      
### Eval output
(kind: exception) Fixture not implemented