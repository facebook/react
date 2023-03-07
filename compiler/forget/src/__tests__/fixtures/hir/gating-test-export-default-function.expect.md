
## Input

```javascript
// @gatingModule @forgetDirective
export default function Bar(props) {
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
import isForgetEnabled from "ReactForgetFeatureFlag"; // @gatingModule @forgetDirective
export default Bar;
function Bar_uncompiled(props) {
  "use forget";
  return <div>{props.bar}</div>;
}
function Bar_forget(props) {
  const $ = React.unstable_useMemoCache(2);
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
var Bar = isForgetEnabled ? Bar_forget : Bar_uncompiled;

function NoForget(props) {
  return <Bar>{props.noForget}</Bar>;
}

function Foo_uncompiled(props) {
  "use forget";
  return <Foo>{props.bar}</Foo>;
}
function Foo_forget(props) {
  const $ = React.unstable_useMemoCache(2);
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
var Foo = isForgetEnabled ? Foo_forget : Foo_uncompiled;

```
      