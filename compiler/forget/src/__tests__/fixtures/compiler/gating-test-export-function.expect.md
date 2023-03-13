
## Input

```javascript
// @gatingModule @forgetDirective
export function Bar(props) {
  "use forget";
  return <div>{props.bar}</div>;
}

export function NoForget(props) {
  return <Bar>{props.noForget}</Bar>;
}

export function Foo(props) {
  "use forget";
  return <Foo>{props.bar}</Foo>;
}

```

## Code

```javascript
import isForgetEnabled from "ReactForgetFeatureFlag"; // @gatingModule @forgetDirective
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
export const Bar = isForgetEnabled ? Bar_forget : Bar_uncompiled;

export function NoForget(props) {
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
export const Foo = isForgetEnabled ? Foo_forget : Foo_uncompiled;

```
      