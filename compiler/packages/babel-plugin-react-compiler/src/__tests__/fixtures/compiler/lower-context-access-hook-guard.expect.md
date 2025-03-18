
## Input

```javascript
// @lowerContextAccess @enableEmitHookGuards
function App() {
  const {foo} = useContext(MyContext);
  const {bar} = useContext(MyContext);
  return <Bar foo={foo} bar={bar} />;
}

```

## Code

```javascript
import {
  useContext_withSelector as _useContext_withSelector,
  $dispatcherGuard as _$dispatcherGuard,
} from "react-compiler-runtime";
import { c as _c } from "react/compiler-runtime"; // @lowerContextAccess @enableEmitHookGuards
function App() {
  const $ = _c(3);
  try {
    _$dispatcherGuard(0);
    const { foo } = (function () {
      try {
        _$dispatcherGuard(2);
        return _useContext_withSelector(MyContext, _temp);
      } finally {
        _$dispatcherGuard(3);
      }
    })();
    const { bar } = (function () {
      try {
        _$dispatcherGuard(2);
        return _useContext_withSelector(MyContext, _temp2);
      } finally {
        _$dispatcherGuard(3);
      }
    })();
    let t0;
    if ($[0] !== bar || $[1] !== foo) {
      t0 = <Bar foo={foo} bar={bar} />;
      $[0] = bar;
      $[1] = foo;
      $[2] = t0;
    } else {
      t0 = $[2];
    }
    return t0;
  } finally {
    _$dispatcherGuard(1);
  }
}
function _temp2(t0) {
  return [t0.bar];
}
function _temp(t0) {
  return [t0.foo];
}

```
      
### Eval output
(kind: exception) Fixture not implemented