
## Input

```javascript
// @enablePropagateDepsInHIR
import {Stringify} from 'shared-runtime';

function Component(props) {
  let x = [];
  let y;
  if (props.p0) {
    x.push(props.p1);
    y = x;
  }
  return (
    <Stringify>
      {x}
      {y}
    </Stringify>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{p0: false, p1: 2}],
  sequentialRenders: [
    {p0: false, p1: 2},
    {p0: false, p1: 2},
    {p0: true, p1: 2},
    {p0: true, p1: 3},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enablePropagateDepsInHIR
import { Stringify } from "shared-runtime";

function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    const x = [];
    let y;
    if (props.p0) {
      x.push(props.p1);
      y = x;
    }

    t0 = (
      <Stringify>
        {x}
        {y}
      </Stringify>
    );
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ p0: false, p1: 2 }],
  sequentialRenders: [
    { p0: false, p1: 2 },
    { p0: false, p1: 2 },
    { p0: true, p1: 2 },
    { p0: true, p1: 3 },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"children":[[],null]}</div>
<div>{"children":[[],null]}</div>
<div>{"children":[[2],"[[ cyclic ref *2 ]]"]}</div>
<div>{"children":[[3],"[[ cyclic ref *2 ]]"]}</div>