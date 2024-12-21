
## Input

```javascript
import {createContext, useContext} from 'react';
import {Stringify} from 'shared-runtime';

const FooContext = createContext({current: true});

function Component(props) {
  const foo = useContext(FooContext);

  const getValue = () => {
    if (foo.current) {
      return {};
    } else {
      return null;
    }
  };
  const value = getValue();

  return <Stringify value={value} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { createContext, useContext } from "react";
import { Stringify } from "shared-runtime";

const FooContext = createContext({ current: true });

function Component(props) {
  const $ = _c(6);
  const foo = useContext(FooContext);
  let t0;
  if ($[0] !== foo.current) {
    t0 = () => {
      if (foo.current) {
        return {};
      } else {
        return null;
      }
    };
    $[0] = foo.current;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const getValue = t0;
  let t1;
  if ($[2] !== getValue) {
    t1 = getValue();
    $[2] = getValue;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const value = t1;
  let t2;
  if ($[4] !== value) {
    t2 = <Stringify value={value} />;
    $[4] = value;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>{"value":{}}</div>