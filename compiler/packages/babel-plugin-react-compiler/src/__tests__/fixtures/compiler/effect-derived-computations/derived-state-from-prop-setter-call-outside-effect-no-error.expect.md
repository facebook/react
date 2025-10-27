
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp
import {useEffect, useState} from 'react';

function Component({initialName}) {
  const [name, setName] = useState('');

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  return (
    <div>
      <input value={name} onChange={e => setName(e.target.value)} />
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{initialName: 'John'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp
import { useEffect, useState } from "react";

function Component(t0) {
  const $ = _c(6);
  const { initialName } = t0;
  const [name, setName] = useState("");
  let t1;
  let t2;
  if ($[0] !== initialName) {
    t1 = () => {
      setName(initialName);
    };
    t2 = [initialName];
    $[0] = initialName;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useEffect(t1, t2);
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = (e) => setName(e.target.value);
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  let t4;
  if ($[4] !== name) {
    t4 = (
      <div>
        <input value={name} onChange={t3} />
      </div>
    );
    $[4] = name;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ initialName: "John" }],
};

```
      
### Eval output
(kind: ok) <div><input value="John"></div>