
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

export default function Component({props}) {
  const [fullName, setFullName] = useState(
    props.firstName + ' ' + props.lastName
  );

  useEffect(() => {
    setFullName(props.firstName + ' ' + props.lastName);
  }, [props.firstName, props.lastName]);

  return <div>{fullName}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{props: {firstName: 'John', lastName: 'Doe'}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects
import { useEffect, useState } from "react";

export default function Component(t0) {
  const $ = _c(6);
  const { props } = t0;
  const [fullName, setFullName] = useState(
    props.firstName + " " + props.lastName,
  );
  let t1;
  let t2;
  if ($[0] !== props.firstName || $[1] !== props.lastName) {
    t1 = () => {
      setFullName(props.firstName + " " + props.lastName);
    };
    t2 = [props.firstName, props.lastName];
    $[0] = props.firstName;
    $[1] = props.lastName;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  let t3;
  if ($[4] !== fullName) {
    t3 = <div>{fullName}</div>;
    $[4] = fullName;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ props: { firstName: "John", lastName: "Doe" } }],
};

```
      
### Eval output
(kind: ok) <div>John Doe</div>