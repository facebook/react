
## Input

```javascript
import {Stringify} from 'shared-runtime';

// Test logical expression as part of optional chain base with method call
function Component(props: {
  a: {x: {getY(): string} | null} | null;
  b: {x: {getY(): string}} | null;
}) {
  'use memo';
  const result = (props.a || props.b)?.x?.getY();
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: null, b: {x: {getY: () => 'found'}}}],
  sequentialRenders: [
    {a: null, b: {x: {getY: () => 'found'}}},
    {a: {x: {getY: () => 'first'}}, b: {x: {getY: () => 'second'}}},
    {a: null, b: null},
    {a: {x: null}, b: {x: {getY: () => 'second'}}},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

// Test logical expression as part of optional chain base with method call
function Component(props) {
  "use memo";
  const $ = _c(5);
  let t0;
  if ($[0] !== props.a || $[1] !== props.b) {
    t0 = (props.a || props.b)?.x?.getY();
    $[0] = props.a;
    $[1] = props.b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const result = t0;
  let t1;
  if ($[3] !== result) {
    t1 = <Stringify value={result} />;
    $[3] = result;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      a: null,
      b: {
        x: {
          getY: () => {
            return "found";
          },
        },
      },
    },
  ],
  sequentialRenders: [
    {
      a: null,
      b: {
        x: {
          getY: () => {
            return "found";
          },
        },
      },
    },
    {
      a: {
        x: {
          getY: () => {
            return "first";
          },
        },
      },
      b: {
        x: {
          getY: () => {
            return "second";
          },
        },
      },
    },
    { a: null, b: null },
    {
      a: { x: null },
      b: {
        x: {
          getY: () => {
            return "second";
          },
        },
      },
    },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"value":"found"}</div>
<div>{"value":"first"}</div>
<div>{}</div>
<div>{}</div>