
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies
import {ValidateMemoization} from 'shared-runtime';
function Component(props) {
  const data = useMemo(() => {
    const x = [];
    x.push(props?.items);
    if (props.cond) {
      x.push(props?.items);
    }
    return x;
  }, [props?.items, props.cond]);
  return (
    <ValidateMemoization inputs={[props?.items, props.cond]} output={data} />
  );
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies
import { ValidateMemoization } from "shared-runtime";
function Component(props) {
  const $ = _c(9);

  props?.items;
  let t0;
  let x;
  if ($[0] !== props?.items || $[1] !== props.cond) {
    x = [];
    x.push(props?.items);
    if (props.cond) {
      x.push(props?.items);
    }
    $[0] = props?.items;
    $[1] = props.cond;
    $[2] = x;
  } else {
    x = $[2];
  }
  t0 = x;
  const data = t0;

  const t1 = props?.items;
  let t2;
  if ($[3] !== props.cond || $[4] !== t1) {
    t2 = [t1, props.cond];
    $[3] = props.cond;
    $[4] = t1;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] !== data || $[7] !== t2) {
    t3 = <ValidateMemoization inputs={t2} output={data} />;
    $[6] = data;
    $[7] = t2;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  return t3;
}

```
      
### Eval output
(kind: exception) Fixture not implemented