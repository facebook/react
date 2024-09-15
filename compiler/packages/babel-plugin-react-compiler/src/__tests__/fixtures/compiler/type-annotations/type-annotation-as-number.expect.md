
## Input

```javascript
// @enableUseTypeAnnotations
import {identity} from 'shared-runtime';

function Component(props: {id: number}) {
  const x = identity(props.id);
  const y = x as number;
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{id: 42}],
};

```

## Code

```javascript
// @enableUseTypeAnnotations
import { identity } from "shared-runtime";

function Component(props) {
  const x = identity(props.id);
  const y = x as number;
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ id: 42 }],
};

```
      
### Eval output
(kind: ok) 42