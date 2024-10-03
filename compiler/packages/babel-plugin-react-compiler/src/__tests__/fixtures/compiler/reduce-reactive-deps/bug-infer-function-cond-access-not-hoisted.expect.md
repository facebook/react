
## Input

```javascript
import {Stringify} from 'shared-runtime';

function Foo({a, shouldReadA}) {
  return (
    <Stringify
      fn={() => {
        if (shouldReadA) return a.b.c;
        return null;
      }}
      shouldInvokeFns={true}
    />
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{a: null, shouldReadA: true}],
  sequentialRenders: [
    {a: null, shouldReadA: true},
    {a: null, shouldReadA: false},
    {a: {b: {c: 4}}, shouldReadA: true},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

function Foo(t0) {
  const $ = _c(3);
  const { a, shouldReadA } = t0;
  let t1;
  if ($[0] !== shouldReadA || $[1] !== a.b.c) {
    t1 = (
      <Stringify
        fn={() => {
          if (shouldReadA) {
            return a.b.c;
          }
          return null;
        }}
        shouldInvokeFns={true}
      />
    );
    $[0] = shouldReadA;
    $[1] = a.b.c;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ a: null, shouldReadA: true }],
  sequentialRenders: [
    { a: null, shouldReadA: true },
    { a: null, shouldReadA: false },
    { a: { b: { c: 4 } }, shouldReadA: true },
  ],
};

```
      