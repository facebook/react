
## Input

```javascript
import {Stringify} from 'shared-runtime';

// Test chained optional property access with nullish coalescing and method call
function Component(props: {obj: {a?: {b?: {getC(): string}}} | null}) {
  'use memo';
  const result = props.obj?.a?.b?.getC() ?? 'default';
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{obj: {a: {b: {getC: () => 'deep'}}}}],
  sequentialRenders: [
    {obj: {a: {b: {getC: () => 'deep'}}}},
    {obj: null},
    {obj: {a: null}},
    {obj: {a: {b: null}}},
    {obj: {a: {b: {getC: () => 'other'}}}},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

// Test chained optional property access with nullish coalescing and method call
function Component(props) {
  "use memo";
  const $ = _c(4);
  let t0;
  if ($[0] !== props.obj?.a?.b) {
    t0 = props.obj?.a?.b?.getC() ?? "default";
    $[0] = props.obj?.a?.b;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const result = t0;
  let t1;
  if ($[2] !== result) {
    t1 = <Stringify value={result} />;
    $[2] = result;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      obj: {
        a: {
          b: {
            getC: () => {
              return "deep";
            },
          },
        },
      },
    },
  ],
  sequentialRenders: [
    {
      obj: {
        a: {
          b: {
            getC: () => {
              return "deep";
            },
          },
        },
      },
    },
    { obj: null },
    { obj: { a: null } },
    { obj: { a: { b: null } } },
    {
      obj: {
        a: {
          b: {
            getC: () => {
              return "other";
            },
          },
        },
      },
    },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"value":"deep"}</div>
<div>{"value":"default"}</div>
<div>{"value":"default"}</div>
<div>{"value":"default"}</div>
<div>{"value":"other"}</div>