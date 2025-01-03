
## Input

```javascript
// @gating @compilationMode(annotation)
export function Bar(props) {
  'use forget';
  return <div>{props.bar}</div>;
}

export function NoForget(props) {
  return <Bar>{props.noForget}</Bar>;
}

export function Foo(props) {
  'use forget';
  return <Foo>{props.bar}</Foo>;
}

```

## Code

```javascript
import { isForgetEnabled_Fixtures } from "ReactForgetFeatureFlag";
import { c as _c } from "react/compiler-runtime"; // @gating @compilationMode(annotation)
export const Bar = isForgetEnabled_Fixtures()
  ? function Bar(props) {
      "use forget";
      const $ = _c(2);
      let t0;
      if ($[0] !== props.bar) {
        t0 = <div>{props.bar}</div>;
        $[0] = props.bar;
        $[1] = t0;
      } else {
        t0 = $[1];
      }
      return t0;
    }
  : function Bar(props) {
      "use forget";
      return <div>{props.bar}</div>;
    };

export function NoForget(props) {
  return <Bar>{props.noForget}</Bar>;
}

export const Foo = isForgetEnabled_Fixtures()
  ? function Foo(props) {
      "use forget";
      const $ = _c(2);
      let t0;
      if ($[0] !== props.bar) {
        t0 = <Foo>{props.bar}</Foo>;
        $[0] = props.bar;
        $[1] = t0;
      } else {
        t0 = $[1];
      }
      return t0;
    }
  : function Foo(props) {
      "use forget";
      return <Foo>{props.bar}</Foo>;
    };

```
      