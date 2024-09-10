
## Input

```javascript
// @enableInlineSingleReturnJSX @compilationMode(infer)

import {Stringify} from 'shared-runtime';

function Child(props) {
  'use no forget';
  return <Stringify props={props} />;
}

function Component({a, b}) {
  return <Child value={a} key={1} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 0, b: 0}],
  sequentialRenders: [
    {a: 0, b: 0},
    {a: 1, b: 0},
    {a: 1, b: 1},
    {a: 0, b: 1},
    {a: 0, b: 0},
    {a: 1, b: 1},
  ],
};

```

## Code

```javascript
// @enableInlineSingleReturnJSX @compilationMode(infer)

import { Stringify } from "shared-runtime";

function Child(props) {
  "use no forget";
  return <Stringify props={props} />;
}

function Component(t0) {
  const { a } = t0;
  1;
  return Child({ value: a });
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 0, b: 0 }],
  sequentialRenders: [
    { a: 0, b: 0 },
    { a: 1, b: 0 },
    { a: 1, b: 1 },
    { a: 0, b: 1 },
    { a: 0, b: 0 },
    { a: 1, b: 1 },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"props":{"value":0}}</div>
<div>{"props":{"value":1}}</div>
<div>{"props":{"value":1}}</div>
<div>{"props":{"value":0}}</div>
<div>{"props":{"value":0}}</div>
<div>{"props":{"value":1}}</div>