
## Input

```javascript
// @enableChangeDetectionWrappers
function Component(props) {
  let x = null;
  if (props.cond) {
    x = [];
    x.push(props.value);
  }
  return x;
}

```

## Code

```javascript
import { $structuralCheck, $store, $restore } from "react-compiler-runtime";
import { c as _c } from "react/compiler-runtime"; // @enableChangeDetectionWrappers
function Component(props) {
  const $ = _c(2);
  let x = null;
  if (props.cond) {
    {
      x = [];
      x.push(props.value);
      let condition = $[0] !== props.value;
      if (!condition) {
        let old$x = $[1];
        $structuralCheck(old$x, x, "x", "Component", "cached", "(3:6)");
        x = $restore(old$x);
      }
      $[0] = props.value;
      $[1] = $store(x);
      if (condition) {
        x = [];
        x.push(props.value);
        $structuralCheck($[1], x, "x", "Component", "recomputed", "(3:6)");
        x = $[1];
      }
    }
  }
  return x;
}

```
      