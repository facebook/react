
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
  return <div>{props.bar}</div>;
}
const Bar = isForgetEnabled ? Bar_forget : Bar_uncompiled;
export default Bar;

function NoForget(props) {
  return <Bar>{props.noForget}</Bar>;
}

function Foo_uncompiled(props) {
  "use forget";
  return <Foo>{props.bar}</Foo>;
}
function Foo_forget(props) {
  return <Foo>{props.bar}</Foo>;
}
export const Foo = isForgetEnabled ? Foo_forget : Foo_uncompiled;

```
      