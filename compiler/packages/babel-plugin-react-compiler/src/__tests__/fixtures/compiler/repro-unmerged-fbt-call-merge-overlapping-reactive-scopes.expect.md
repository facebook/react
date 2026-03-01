
## Input

```javascript
import fbt from 'fbt';
import {Stringify} from 'shared-runtime';

function Component(props) {
  const label = fbt(
    fbt.plural('bar', props.value.length, {
      many: 'bars',
      showCount: 'yes',
    }),
    'The label text'
  );
  return props.cond ? (
    <Stringify
      description={<fbt desc="Some text">Text here</fbt>}
      label={label.toString()}
    />
  ) : null;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{cond: true, value: [0, 1, 2]}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import fbt from "fbt";
import { Stringify } from "shared-runtime";

function Component(props) {
  const $ = _c(5);
  let t0;
  if ($[0] !== props.value.length) {
    t0 = fbt._(
      { "*": "{number} bars", _1: "1 bar" },
      [fbt._plural(props.value.length, "number")],
      { hk: "4mUen7" },
    );
    $[0] = props.value.length;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const label = t0;
  let t1;
  if ($[2] !== label || $[3] !== props.cond) {
    t1 = props.cond ? (
      <Stringify
        description={fbt._("Text here", null, { hk: "21YpZs" })}
        label={label.toString()}
      />
    ) : null;
    $[2] = label;
    $[3] = props.cond;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true, value: [0, 1, 2] }],
};

```
      
### Eval output
(kind: ok) <div>{"description":"Text here","label":"3 bars"}</div>