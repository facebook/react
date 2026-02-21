
## Input

```javascript
// @enableFire @panicThreshold:"none"
import {fire} from 'react';

/**
 * Compilation of this file should succeed.
 */
function NonFireComponent({prop1}) {
  /**
   * This component bails out but does not use fire
   */
  const foo = () => {
    try {
      console.log(prop1);
    } finally {
      console.log('jbrown215');
    }
  };
  useEffect(() => {
    foo();
  });
}

function FireComponent(props) {
  /**
   * This component uses fire and compiles successfully
   */
  const foo = props => {
    console.log(props);
  };
  useEffect(() => {
    fire(foo(props));
  });

  return null;
}

```

## Code

```javascript
import { c as _c, useFire } from "react/compiler-runtime"; // @enableFire @panicThreshold:"none"
import { fire } from "react";

/**
 * Compilation of this file should succeed.
 */
function NonFireComponent({ prop1 }) {
  /**
   * This component bails out but does not use fire
   */
  const foo = () => {
    try {
      console.log(prop1);
    } finally {
      console.log("jbrown215");
    }
  };
  useEffect(() => {
    foo();
  });
}

function FireComponent(props) {
  const $ = _c(3);

  const foo = _temp;
  const t0 = useFire(foo);
  let t1;
  if ($[0] !== props || $[1] !== t0) {
    t1 = () => {
      t0(props);
    };
    $[0] = props;
    $[1] = t0;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  useEffect(t1);

  return null;
}
function _temp(props_0) {
  console.log(props_0);
}

```
      
### Eval output
(kind: exception) Fixture not implemented