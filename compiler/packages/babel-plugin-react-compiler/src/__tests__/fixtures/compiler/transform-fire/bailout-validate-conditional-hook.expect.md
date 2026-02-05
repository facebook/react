
## Input

```javascript
// @enableFire @panicThreshold:"none"
import {fire, useEffect} from 'react';
import {Stringify} from 'shared-runtime';

/**
 * When @enableFire is specified, retry compilation with validation passes (e.g.
 * hook usage) disabled
 */
function Component(props) {
  const foo = props => {
    console.log(props);
  };

  if (props.cond) {
    useEffect(() => {
      fire(foo(props));
    });
  }

  return <Stringify />;
}

```

## Code

```javascript
import { useFire } from "react/compiler-runtime"; // @enableFire @panicThreshold:"none"
import { fire, useEffect } from "react";
import { Stringify } from "shared-runtime";

/**
 * When @enableFire is specified, retry compilation with validation passes (e.g.
 * hook usage) disabled
 */
function Component(props) {
  const foo = _temp;

  if (props.cond) {
    const t0 = useFire(foo);
    useEffect(() => {
      t0(props);
    });
  }

  return <Stringify />;
}
function _temp(props_0) {
  console.log(props_0);
}

```
      
### Eval output
(kind: exception) Fixture not implemented