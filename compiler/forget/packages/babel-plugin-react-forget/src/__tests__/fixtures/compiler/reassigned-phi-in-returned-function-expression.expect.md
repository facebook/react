
## Input

```javascript
// @enableOptimizeFunctionExpressions
function Component(props) {
  return () => {
    let str;
    if (arguments.length) {
      str = arguments[0];
    } else {
      str = props.str;
    }
    global.log(str);
  };
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableOptimizeFunctionExpressions
function Component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.str;
  let t0;
  if (c_0) {
    t0 = () => {
      let str = undefined;
      if (arguments.length) {
        str = arguments[0];
      } else {
        str = props.str;
      }

      global.log(str);
    };
    $[0] = props.str;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      