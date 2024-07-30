
## Input

```javascript
import fbt from 'fbt';
import {identity} from 'shared-runtime';

/**
 * Note that the fbt transform looks for callsites with a `fbt`-named callee.
 * This is incompatible with react-compiler as we rename local variables in
 * HIRBuilder + RenameVariables.
 *
 * See evaluator error:
 *   Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) <div>Hello, Sathya!Goodbye, Sathya!</div>
 *   Forget:
 *   (kind: exception) fbt$0.param is not a function
 */

function Foo(props) {
  const getText1 = fbt =>
    fbt(
      `Hello, ${fbt.param('(key) name', identity(props.name))}!`,
      '(description) Greeting'
    );

  const getText2 = fbt =>
    fbt(
      `Goodbye, ${fbt.param('(key) name', identity(props.name))}!`,
      '(description) Greeting2'
    );

  return (
    <div>
      {getText1(fbt)}
      {getText2(fbt)}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{name: 'Sathya'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import fbt from "fbt";
import { identity } from "shared-runtime";

/**
 * Note that the fbt transform looks for callsites with a `fbt`-named callee.
 * This is incompatible with react-compiler as we rename local variables in
 * HIRBuilder + RenameVariables.
 *
 * See evaluator error:
 *   Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) <div>Hello, Sathya!Goodbye, Sathya!</div>
 *   Forget:
 *   (kind: exception) fbt$0.param is not a function
 */

function Foo(props) {
  const $ = _c(11);
  let t0;
  if ($[0] !== props.name) {
    t0 = (fbt$0) =>
      fbt$0(
        `Hello, ${fbt$0.param("(key) name", identity(props.name))}!`,
        "(description) Greeting",
      );
    $[0] = props.name;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const getText1 = t0;
  let t1;
  if ($[2] !== props.name) {
    t1 = (fbt_0) =>
      fbt_0(
        `Goodbye, ${fbt_0.param("(key) name", identity(props.name))}!`,
        "(description) Greeting2",
      );
    $[2] = props.name;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const getText2 = t1;
  let t2;
  if ($[4] !== getText1) {
    t2 = getText1(fbt);
    $[4] = getText1;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] !== getText2) {
    t3 = getText2(fbt);
    $[6] = getText2;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  let t4;
  if ($[8] !== t2 || $[9] !== t3) {
    t4 = (
      <div>
        {t2}
        {t3}
      </div>
    );
    $[8] = t2;
    $[9] = t3;
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ name: "Sathya" }],
};

```
      