
## Input

```javascript
import {Stringify, identity} from 'shared-runtime';

function foo() {
  return (
    <Stringify
      value={[
        `` === '',
        `a${1}b`,
        ` abc \u0041\n\u000a\ŧ`,
        `abc${1}def`,
        `abc${1}def${2}`,
        `abc${1}def${2}ghi`,
        `a${1 + 3}b${``}c${'d' + `e${2 + 4}f`}`,
        `1${2}${Math.sin(0)}`,
        `${NaN}`,
        `${Infinity}`,
        `${-Infinity}`,
        `${0}123456789`,
        `123456789${0}`,
        `${0}123456789${0}`,
        `${0}1234${5}6789${0}`,
        `${0}1234${`${0}123456789${`${0}123456789${0}`}`}6789${0}`,
        `${0}1234${`${0}123456789${`${identity(0)}`}`}6789${0}`,
        `${`${`${`${0}`}`}`}`,
        `${`${`${`${""}`}`}`}`,
        `${`${`${`${identity("")}`}`}`}`,
      ]}
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
import { Stringify, identity } from "shared-runtime";

function foo() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (
      <Stringify
        value={[
          true,

          "a1b",
          " abc A\n\n\u0167",
          "abc1def",
          "abc1def2",
          "abc1def2ghi",
          "a4bcde6f",
          `1${2}${Math.sin(0)}`,
          `${NaN}`,
          `${Infinity}`,
          `${-Infinity}`,
          "0123456789",
          "1234567890",
          "01234567890",
          "01234567890",
          "0123401234567890123456789067890",
          `${0}1234${`${0}123456789${`${identity(0)}`}`}6789${0}`,
          "0",
          "",
          `${`${`${`${identity("")}`}`}`}`,
        ]}
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
(kind: ok) <div>{"value":[true,"a1b"," abc A\n\nŧ","abc1def","abc1def2","abc1def2ghi","a4bcde6f","120","NaN","Infinity","-Infinity","0123456789","1234567890","01234567890","01234567890","0123401234567890123456789067890","012340123456789067890","0","",""]}</div>