
## Input

```javascript
import fbt from 'fbt';

function Component(props) {
  const element = (
    <fbt desc={'Dialog to show to user'}>
      Hello <fbt:param name="user name">{props.name}</fbt:param>
    </fbt>
  );
  return element.toString();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{name: 'Jason'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import fbt from "fbt";

function Component(props) {
  const $ = _c(4);
  let t0;
  if ($[0] !== props.name) {
    t0 = fbt._("Hello {user name}", [fbt._param("user name", props.name)], {
      hk: "2zEDKF",
    });
    $[0] = props.name;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const element = t0;
  let t1;
  if ($[2] !== element) {
    t1 = element.toString();
    $[2] = element;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ name: "Jason" }],
};

```
      
### Eval output
(kind: ok) "Hello Jason"