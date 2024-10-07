
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies @enablePropagateDepsInHIR
import {ValidateMemoization} from 'shared-runtime';
function Component(props) {
  const data = useMemo(() => {
    const x = [];
    x.push(props?.items);
    x.push(props.items);
    return x;
  }, [props.items]);
  return <ValidateMemoization inputs={[props.items]} output={data} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies @enablePropagateDepsInHIR
import { ValidateMemoization } from "shared-runtime";
function Component(props) {
  const $ = _c(7);
  let t0;
  let x;
  if ($[0] !== props.items) {
    x = [];
    x.push(props?.items);
    x.push(props.items);
    $[0] = props.items;
    $[1] = x;
  } else {
    x = $[1];
  }
  t0 = x;
  const data = t0;
  let t1;
  if ($[2] !== props.items) {
    t1 = [props.items];
    $[2] = props.items;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== t1 || $[5] !== data) {
    t2 = <ValidateMemoization inputs={t1} output={data} />;
    $[4] = t1;
    $[5] = data;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

```
      
### Eval output
(kind: exception) Fixture not implemented