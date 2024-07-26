
## Input

```javascript
import {ValidateMemoization} from 'shared-runtime';
import {use, useMemo} from 'react';

const FooContext = React.createContext(null);
function Component(props) {
  return (
    <FooContext.Provider value={props.value}>
      <Inner cond={props.cond} />
    </FooContext.Provider>
  );
}

function Inner(props) {
  let input = null;
  if (props.cond) {
    input = use(FooContext);
  }
  const output = useMemo(() => [input], [input]);
  return <ValidateMemoization inputs={[input]} output={output} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{cond: true, value: 42}],
  sequentialRenders: [
    // change cond true->false
    {cond: true, value: 42},
    {cond: false, value: 42},

    // change value
    {cond: false, value: null},
    {cond: false, value: 42},

    // change cond false->true
    {cond: true, value: 42},

    // change cond true->false, change unobserved value, change cond false->true
    {cond: false, value: 42},
    {cond: false, value: null},
    {cond: true, value: 42},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { ValidateMemoization } from "shared-runtime";
import { use, useMemo } from "react";

const FooContext = React.createContext(null);
function Component(props) {
  const $ = _c(5);
  let t0;
  if ($[0] !== props.cond) {
    t0 = <Inner cond={props.cond} />;
    $[0] = props.cond;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== props.value || $[3] !== t0) {
    t1 = <FooContext.Provider value={props.value}>{t0}</FooContext.Provider>;
    $[2] = props.value;
    $[3] = t0;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

function Inner(props) {
  const $ = _c(7);
  let input;
  input = null;
  if (props.cond) {
    input = use(FooContext);
  }

  input;
  input;
  let t0;
  const t1 = input;
  let t2;
  if ($[0] !== t1) {
    t2 = [t1];
    $[0] = t1;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  t0 = t2;
  const output = t0;
  const t3 = input;
  let t4;
  if ($[2] !== t3) {
    t4 = [t3];
    $[2] = t3;
    $[3] = t4;
  } else {
    t4 = $[3];
  }
  let t5;
  if ($[4] !== t4 || $[5] !== output) {
    t5 = <ValidateMemoization inputs={t4} output={output} />;
    $[4] = t4;
    $[5] = output;
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  return t5;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true, value: 42 }],
  sequentialRenders: [
    // change cond true->false
    { cond: true, value: 42 },
    { cond: false, value: 42 },

    // change value
    { cond: false, value: null },
    { cond: false, value: 42 },

    // change cond false->true
    { cond: true, value: 42 },

    // change cond true->false, change unobserved value, change cond false->true
    { cond: false, value: 42 },
    { cond: false, value: null },
    { cond: true, value: 42 },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[42],"output":[42]}</div>
<div>{"inputs":[null],"output":["[[ cyclic ref *2 ]]"]}</div>
<div>{"inputs":[null],"output":["[[ cyclic ref *2 ]]"]}</div>
<div>{"inputs":[null],"output":["[[ cyclic ref *2 ]]"]}</div>
<div>{"inputs":[42],"output":[42]}</div>
<div>{"inputs":[null],"output":["[[ cyclic ref *2 ]]"]}</div>
<div>{"inputs":[null],"output":["[[ cyclic ref *2 ]]"]}</div>
<div>{"inputs":[42],"output":[42]}</div>