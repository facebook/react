
## Input

```javascript
// @compilationMode:"infer"
/**
 * Regression test for https://github.com/facebook/react/issues/34901
 *
 * When an arrow-function component is defined inside a factory function,
 * inner callbacks that capture variables from the factory function scope
 * must NOT be outlined to module scope.
 *
 * Bug: in `infer` mode, the compiler compiled `Counter` as a standalone
 * component. Variables from the factory function scope (e.g. `counter`)
 * were misclassified as `ModuleLocal` and emitted as `LoadGlobal`
 * instructions with an empty context array on inner functions like
 * `getCount`. The `outlineFunctions` pass saw `context.length === 0` and
 * incorrectly outlined `getCount` to a top-level `_temp` helper where
 * `counter` was undefined at runtime.
 *
 * Fix: `outlineFunctions` now checks whether the function body contains
 * a `LoadGlobal(ModuleLocal)` reference to a name that does not exist at
 * the true program/module scope. If so, the function is not outlined.
 */
function makeCounter(initialValue) {
  const counter = {value: initialValue};

  // `getCount` captures `counter` from the factory scope.
  // It must stay inline — outlined as a top-level function it would break.
  const Counter = () => {
    const getCount = () => counter.value;
    return <div>{getCount()}</div>;
  };

  return Counter;
}

const Counter = makeCounter(42);

export const FIXTURE_ENTRYPOINT = {
  fn: Counter,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @compilationMode:"infer"
/**
 * Regression test for https://github.com/facebook/react/issues/34901
 *
 * When an arrow-function component is defined inside a factory function,
 * inner callbacks that capture variables from the factory function scope
 * must NOT be outlined to module scope.
 *
 * Bug: in `infer` mode, the compiler compiled `Counter` as a standalone
 * component. Variables from the factory function scope (e.g. `counter`)
 * were misclassified as `ModuleLocal` and emitted as `LoadGlobal`
 * instructions with an empty context array on inner functions like
 * `getCount`. The `outlineFunctions` pass saw `context.length === 0` and
 * incorrectly outlined `getCount` to a top-level `_temp` helper where
 * `counter` was undefined at runtime.
 *
 * Fix: `outlineFunctions` now checks whether the function body contains
 * a `LoadGlobal(ModuleLocal)` reference to a name that does not exist at
 * the true program/module scope. If so, the function is not outlined.
 */
function makeCounter(initialValue) {
  const counter = { value: initialValue };

  // `getCount` captures `counter` from the factory scope.
  // It must stay inline — outlined as a top-level function it would break.
  const Counter = () => {
    const $ = _c(1);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      const getCount = () => counter.value;
      t0 = <div>{getCount()}</div>;
      $[0] = t0;
    } else {
      t0 = $[0];
    }
    return t0;
  };

  return Counter;
}

const Counter = makeCounter(42);

export const FIXTURE_ENTRYPOINT = {
  fn: Counter,
  params: [],
};

```
      
### Eval output
(kind: ok) <div>42</div>
