## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(null);
  const value = props.value;
  foo(ref, value);
  return <div></div>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);
  const ref = useRef(null);
  const value = props.value;
  foo(ref, value);
  return <div></div>;
}
