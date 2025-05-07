
## Input

```javascript
import {Stringify} from 'shared-runtime';

function foo() {
  return (
    <Stringify
      value={{
        a: `` === "",
        b: `a${1}b`,
        c: ` abc \u0041\n\u000a\ŧ`,
        d: `abc${1}def`,
        e: `abc${1}def${2}`,
        f: `abc${1}def${2}ghi`,
        g: `a${1 + 3}b${``}c${"d" + `e${2 + 4}f`}`,
        h: `1${2}${Math.sin(0)}`,
      }}
    />
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

function foo() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (
      <Stringify
        value={{
          a: true,
          b: "a1b",
          c: " abc A\n\n\u0167",
          d: "abc1def",
          e: "abc1def2",
          f: "abc1def2ghi",
          g: "a4bcde6f",
          h: `1${2}${Math.sin(0)}`,
        }}
      />
    );
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) <div>{"value":{"a":true,"b":"a1b","c":" abc A\n\nŧ","d":"abc1def","e":"abc1def2","f":"abc1def2ghi","g":"a4bcde6f","h":"120"}}</div>