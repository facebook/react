
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component({firstName}) {
  const [lastName, setLastName] = useState('Doe');
  const [fullName, setFullName] = useState('John');

  const middleName = 'D.';

  useEffect(() => {
    setFullName(firstName + ' ' + middleName + ' ' + lastName);
  }, [firstName, middleName, lastName]);

  return (
    <div>
      <input value={lastName} onChange={e => setLastName(e.target.value)} />
      <div>{fullName}</div>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{firstName: 'John'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects
import { useEffect, useState } from "react";

function Component(t0) {
  const $ = _c(12);
  const { firstName } = t0;
  const [lastName, setLastName] = useState("Doe");
  const [fullName, setFullName] = useState("John");
  let t1;
  let t2;
  if ($[0] !== firstName || $[1] !== lastName) {
    t1 = () => {
      setFullName(firstName + " " + "D." + " " + lastName);
    };
    t2 = [firstName, "D.", lastName];
    $[0] = firstName;
    $[1] = lastName;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  let t3;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = (e) => setLastName(e.target.value);
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  if ($[5] !== lastName) {
    t4 = <input value={lastName} onChange={t3} />;
    $[5] = lastName;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  let t5;
  if ($[7] !== fullName) {
    t5 = <div>{fullName}</div>;
    $[7] = fullName;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  let t6;
  if ($[9] !== t4 || $[10] !== t5) {
    t6 = (
      <div>
        {t4}
        {t5}
      </div>
    );
    $[9] = t4;
    $[10] = t5;
    $[11] = t6;
  } else {
    t6 = $[11];
  }
  return t6;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ firstName: "John" }],
};

```
      
### Eval output
(kind: ok) <div><input value="Doe"><div>John D. Doe</div></div>