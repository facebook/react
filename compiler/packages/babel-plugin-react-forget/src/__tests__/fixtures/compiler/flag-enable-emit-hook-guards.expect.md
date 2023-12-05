
## Input

```javascript
// @enableEmitHookGuards
import { createContext, useContext, useEffect, useState } from "react";
import {
  CONST_STRING0,
  ObjectWithHooks,
  getNumber,
  identity,
  print,
} from "shared-runtime";

const MyContext = createContext("my context value");
function Component({ value }) {
  print(identity(CONST_STRING0));
  const [state, setState] = useState(getNumber());
  print(value, state);
  useEffect(() => {
    if (state === 4) {
      setState(5);
    }
  }, [state]);
  print(identity(value + state));
  return ObjectWithHooks.useIdentity(useContext(MyContext));
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  args: [{ value: 0 }],
};

```

## Code

```javascript
import { $dispatcherGuard } from "react-forget-runtime"; // @enableEmitHookGuards
import {
  createContext,
  useContext,
  useEffect,
  useState,
  unstable_useMemoCache as useMemoCache,
} from "react";
import {
  CONST_STRING0,
  ObjectWithHooks,
  getNumber,
  identity,
  print,
} from "shared-runtime";

const MyContext = createContext("my context value");
function Component(t47) {
  try {
    $dispatcherGuard(0);
    const $ = useMemoCache(4);
    const { value } = t47;
    print(identity(CONST_STRING0));
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = getNumber();
      $[0] = t0;
    } else {
      t0 = $[0];
    }
    const [state, setState] = (() => {
      try {
        $dispatcherGuard(2);
        return useState(t0);
      } finally {
        $dispatcherGuard(3);
      }
    })();
    print(value, state);
    let t1;
    let t2;
    if ($[1] !== state) {
      t1 = () => {
        if (state === 4) {
          setState(5);
        }
      };

      t2 = [state];
      $[1] = state;
      $[2] = t1;
      $[3] = t2;
    } else {
      t1 = $[2];
      t2 = $[3];
    }
    (() => {
      try {
        $dispatcherGuard(2);
        return useEffect(t1, t2);
      } finally {
        $dispatcherGuard(3);
      }
    })();
    print(identity(value + state));
    return (() => {
      try {
        $dispatcherGuard(2);
        return ObjectWithHooks.useIdentity(
          (() => {
            try {
              $dispatcherGuard(2);
              return useContext(MyContext);
            } finally {
              $dispatcherGuard(3);
            }
          })()
        );
      } finally {
        $dispatcherGuard(3);
      }
    })();
  } finally {
    $dispatcherGuard(1);
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  args: [{ value: 0 }],
};

```
      