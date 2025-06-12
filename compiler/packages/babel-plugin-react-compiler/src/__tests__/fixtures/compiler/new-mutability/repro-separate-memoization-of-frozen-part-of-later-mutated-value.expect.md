
## Input

```javascript
// @flow @enableNewMutationAliasingModel:false

import {identity, Stringify, useFragment} from 'shared-runtime';

component CometPageFinancialServicesVerifiedEntitiesListItem() {
  const data = useFragment();

  const {a, b} = identity(data);

  // This should memoize independently from `a`
  const iconWithToolTip = <Stringify tooltip={b} />;

  identity(a.at(0));

  return <Stringify icon={iconWithToolTip} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";

import { identity, Stringify, useFragment } from "shared-runtime";

function CometPageFinancialServicesVerifiedEntitiesListItem() {
  const $ = _c(6);
  const data = useFragment();
  let t0;
  if ($[0] !== data) {
    t0 = identity(data);
    $[0] = data;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const { a, b } = t0;
  let t1;
  if ($[2] !== b) {
    t1 = <Stringify tooltip={b} />;
    $[2] = b;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const iconWithToolTip = t1;

  identity(a.at(0));
  let t2;
  if ($[4] !== iconWithToolTip) {
    t2 = <Stringify icon={iconWithToolTip} />;
    $[4] = iconWithToolTip;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

```
      
### Eval output
(kind: exception) Fixture not implemented