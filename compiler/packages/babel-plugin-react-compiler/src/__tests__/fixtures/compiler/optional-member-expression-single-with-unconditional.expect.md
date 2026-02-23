
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies
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
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies
import { ValidateMemoization } from "shared-runtime";
function Component(props) {
  const $ = _c(7);
  let x;
  if (!Object.is($[0], props.items)) {
    x = [];
    x.push(props?.items);
    x.push(props.items);
    $[0] = props.items;
    $[1] = x;
  } else {
    x = $[1];
  }
  const data = x;
  let t0;
  if (!Object.is($[2], props.items)) {
    t0 = [props.items];
    $[2] = props.items;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  let t1;
  if (!Object.is($[4], data) || !Object.is($[5], t0)) {
    t1 = <ValidateMemoization inputs={t0} output={data} />;
    $[4] = data;
    $[5] = t0;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
}

```
      
### Eval output
(kind: exception) Fixture not implemented