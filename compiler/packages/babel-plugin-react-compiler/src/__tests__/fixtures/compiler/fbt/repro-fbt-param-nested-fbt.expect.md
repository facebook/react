
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
  const $ = _c(5);
  const { firstname, lastname } = t0;
  let t1;
  if ($[0] !== firstname || $[1] !== lastname) {
    t1 = fbt._(
      "Name: {firstname}, {lastname}",
      [
        fbt._param(
          "firstname",

          <Stringify key={0} name={firstname} />,
        ),
        fbt._param(
          "lastname",

          <Stringify key={0} name={lastname}>
            {fbt._("(inner fbt)", null, { hk: "36qNwF" })}
          </Stringify>,
        ),
      ],
      { hk: "3AiIf8" },
    );
    $[0] = firstname;
    $[1] = lastname;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== t1) {
    t2 = <Stringify>{t1}</Stringify>;
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
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