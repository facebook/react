
## Input

```javascript
// @compilationMode(infer)
// Regression test for https://github.com/facebook/react/issues/34901
// The compiler should NOT outline functions that capture variables from their closure.
// In this case, `() => store` captures `store` from the outer scope and should not
// be hoisted to a top-level function because `store` would be undefined.

class SomeStore {
  test = 'hello';
}

function useLocalObservable(fn) {
  return fn();
}

export function createSomething() {
  const store = new SomeStore();

  const Cmp = () => {
    const observedStore = useLocalObservable(() => store);
    return <div>{observedStore.test}</div>;
  };

  return Cmp;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createSomething,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
class SomeStore {
  test = "hello";
}

function useLocalObservable(fn) {
  return fn();
}

export function createSomething() {
  const $ = _c(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const store = new SomeStore();

    const Cmp = () => {
      const $ = _c(2);
      const observedStore = useLocalObservable(() => store);
      let t0;
      if ($[0] !== observedStore.test) {
        t0 = <div>{observedStore.test}</div>;
        $[0] = observedStore.test;
        $[1] = t0;
      } else {
        t0 = $[1];
      }
      return t0;
    };

    t0 = Cmp;
    $[0] = t0;
    $[1] = store;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createSomething,
  params: [],
};

```
      
### Eval output
(kind: ok) <div>hello</div>
