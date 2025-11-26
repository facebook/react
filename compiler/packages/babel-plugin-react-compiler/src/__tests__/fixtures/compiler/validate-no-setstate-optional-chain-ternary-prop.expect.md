
## Input

```javascript
// @validateNoSetStateInRender
import {useState} from 'react';

function Component({data, setTotal}) {
  setTotal(data.rows?.count != null ? data.rows?.count : 0);
  return null;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{data: {rows: {count: 3}}, setTotal: () => {}}],
  isComponent: true,
};

```

## Code

```javascript
// @validateNoSetStateInRender
import { useState } from "react";

function Component(t0) {
  const { data, setTotal } = t0;
  setTotal(data.rows?.count != null ? data.rows?.count : 0);
  return null;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ data: { rows: { count: 3 } }, setTotal: () => {} }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) null