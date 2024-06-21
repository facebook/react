
## Input

```javascript
import { identity, mutate, mutateAndReturnNewValue } from "shared-runtime";

function Component(props) {
  const key = {};
  // Key is modified by the function, but key itself is not frozen
  const element = <div key={mutateAndReturnNewValue(key)}>{props.value}</div>;
  // Key is later mutated here: this mutation must be grouped with the
  // jsx construction above
  mutate(key);
  return element;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity, mutate, mutateAndReturnNewValue } from "shared-runtime";

function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.value) {
    const key = {};

    const element = <div key={mutateAndReturnNewValue(key)}>{props.value}</div>;

    t0 = element;
    mutate(key);
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      
### Eval output
(kind: ok) <div>42</div>