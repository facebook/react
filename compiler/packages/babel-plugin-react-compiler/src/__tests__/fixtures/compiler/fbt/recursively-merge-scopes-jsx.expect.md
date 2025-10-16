
## Input

```javascript
// @flow
import {fbt} from 'fbt';

function Example({x}) {
  // "Inner Text" needs to be visible to fbt: the <Bar> element cannot
  // be memoized separately
  return (
    <fbt desc="Description">
      Outer Text
      <Foo x={x}>
        <Bar>Inner Text</Bar>
      </Foo>
    </fbt>
  );
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { fbt } from "fbt";

function Example(t0) {
  const $ = _c(2);
  const { x } = t0;
  let t1;
  if ($[0] !== x) {
    t1 = fbt._(
      "Outer Text {=m1}",
      [
        fbt._implicitParam(
          "=m1",

          <Foo x={x}>
            {fbt._(
              "{=m1}",
              [
                fbt._implicitParam(
                  "=m1",
                  <Bar>{fbt._("Inner Text", null, { hk: "32YB0l" })}</Bar>,
                ),
              ],
              { hk: "23dJsI" },
            )}
          </Foo>,
        ),
      ],
      { hk: "2RVA7V" },
    );
    $[0] = x;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      
### Eval output
(kind: exception) Fixture not implemented