
## Input

```javascript
// @enableEmitStructuredHooks @target:"18"

import {useState} from 'react';

function Foo(props) {
  'use structured hooks';

  if (props.showDetail) {
    const [label] = useState('Ada');
    return <div>{label}</div>;
  }

  return <div>hidden</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{showDetail: true}],
};

```

## Code

```javascript
import { experimental_useStructuredHooks as useStructuredHooks } from "react-compiler-runtime"; // @enableEmitStructuredHooks @target:"18"

import { useState } from "react";

function Foo(props) {
  return useStructuredHooks(function (hooks) {
    if (props.showDetail) {
      const [label] = hooks.state("state_0", "Ada");
      return <div>{label}</div>;
    }
    return <div>hidden</div>;
  });
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ showDetail: true }],
};

```
      
### Eval output
(kind: ok) <div>Ada</div>