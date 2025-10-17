
## Input

```javascript
import fbt from 'fbt';
import {Stringify} from 'shared-runtime';

/**
 * MemoizeFbtAndMacroOperands needs to account for nested fbt calls.
 * Expected fixture `fbt-param-call-arguments` to succeed but it failed with error:
 *   /fbt-param-call-arguments.ts: Line 19 Column 11: fbt: unsupported babel node: Identifier
 *   ---
 *   t3
 *   ---
 */
function Component({firstname, lastname}) {
  'use memo';
  return (
    <Stringify>
      {fbt(
        [
          'Name: ',
          fbt.param('firstname', <Stringify key={0} name={firstname} />),
          ', ',
          fbt.param(
            'lastname',
            <Stringify key={0} name={lastname}>
              {fbt('(inner fbt)', 'Inner fbt value')}
            </Stringify>
          ),
        ],
        'Name'
      )}
    </Stringify>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{firstname: 'first', lastname: 'last'}],
  sequentialRenders: [{firstname: 'first', lastname: 'last'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import fbt from "fbt";
import { Stringify } from "shared-runtime";

/**
 * MemoizeFbtAndMacroOperands needs to account for nested fbt calls.
 * Expected fixture `fbt-param-call-arguments` to succeed but it failed with error:
 *   /fbt-param-call-arguments.ts: Line 19 Column 11: fbt: unsupported babel node: Identifier
 *   ---
 *   t3
 *   ---
 */
function Component(t0) {
  "use memo";
  const $ = _c(10);
  const { firstname, lastname } = t0;
  let t1;
  if ($[0] !== firstname || $[1] !== lastname) {
    let t2;
    if ($[3] !== firstname) {
      t2 = <Stringify key={0} name={firstname} />;
      $[3] = firstname;
      $[4] = t2;
    } else {
      t2 = $[4];
    }
    let t3;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      t3 = fbt._("(inner fbt)", null, { hk: "36qNwF" });
      $[5] = t3;
    } else {
      t3 = $[5];
    }
    let t4;
    if ($[6] !== lastname) {
      t4 = (
        <Stringify key={0} name={lastname}>
          {t3}
        </Stringify>
      );
      $[6] = lastname;
      $[7] = t4;
    } else {
      t4 = $[7];
    }
    t1 = fbt._(
      "Name: {firstname}, {lastname}",
      [fbt._param("firstname", t2), fbt._param("lastname", t4)],
      { hk: "3AiIf8" },
    );
    $[0] = firstname;
    $[1] = lastname;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[8] !== t1) {
    t2 = <Stringify>{t1}</Stringify>;
    $[8] = t1;
    $[9] = t2;
  } else {
    t2 = $[9];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ firstname: "first", lastname: "last" }],
  sequentialRenders: [{ firstname: "first", lastname: "last" }],
};

```
      
### Eval output
(kind: ok) <div>{"children":"Name: , "}</div>