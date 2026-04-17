
## Input

```javascript
// @enableEmitStructuredHooks @target:"18"

import * as React from 'react';

function Foo(props) {
  'use structured hooks';

  if (!props.showBadge) {
    return <div>hidden</div>;
  }

  const label = React.useMemo(() => props.label.toUpperCase(), [props.label]);
  return <div>{label}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{label: 'ada', showBadge: true}],
};
```

## Code

```javascript
import { experimental_useStructuredHooks as useStructuredHooks } from "react-compiler-runtime"; // @enableEmitStructuredHooks @target:"18"

import * as React from "react";

function Foo(props) {
  return useStructuredHooks(function (hooks) {
    if (!props.showBadge) {
      return <div>hidden</div>;
    }
    const label = hooks.memo("memo_0", [props.label], () =>
      props.label.toUpperCase(),
    );
    return <div>{label}</div>;
  });
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ label: "ada", showBadge: true }],
};

```
      
### Eval output
(kind: ok) <div>ADA</div>