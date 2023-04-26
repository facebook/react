
## Input

```javascript
// @gating @forgetDirective
function Bar(props) {
  "use forget";
  return <div>{props.bar}</div>;
}

function NoForget(props) {
  return <Bar>{props.noForget}</Bar>;
}

function Foo(props) {
  "use forget";
  return <Foo>{props.bar}</Foo>;
}

```

## Code

```javascript
import { isForgetEnabled_Fixtures } from "ReactForgetFeatureFlag";
import { unstable_useMemoCache as useMemoCache } from "react"; // @gating @forgetDirective
function Bar_uncompiled(props) {
  "use forget";
  return <div>{props.bar}</div>;
}
function Bar_forget(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.bar;
  let t0;
  if (c_0) {
    t0 = <div>{props.bar}</div>;
    $[0] = props.bar;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}
const Bar = isForgetEnabled_Fixtures() ? Bar_forget : Bar_uncompiled;

function NoForget(props) {
  return <Bar>{props.noForget}</Bar>;
}

function Foo_uncompiled(props) {
  "use forget";
  return <Foo>{props.bar}</Foo>;
}
function Foo_forget(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.bar;
  let t0;
  if (c_0) {
    t0 = <Foo>{props.bar}</Foo>;
    $[0] = props.bar;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}
const Foo = isForgetEnabled_Fixtures() ? Foo_forget : Foo_uncompiled;

```
      