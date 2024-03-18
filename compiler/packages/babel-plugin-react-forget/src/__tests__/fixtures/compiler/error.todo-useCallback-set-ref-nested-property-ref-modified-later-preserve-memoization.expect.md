
## Input

```javascript
// @enablePreserveExistingMemoizationGuarantees
import { useCallback, useRef } from "react";

function Component(props) {
  const ref = useRef({ inner: null });

  const onChange = useCallback((event) => {
    // The ref should still be mutable here even though function deps are frozen in
    // @enablePreserveExistingMemoizationGuarantees mode
    ref.current.inner = event.target.value;
  });

  // The ref is modified later, extending its range and preventing memoization of onChange
  ref.current.inner = null;

  return <input onChange={onChange} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```


## Error

```
   5 |   const ref = useRef({ inner: null });
   6 |
>  7 |   const onChange = useCallback((event) => {
     |                                ^^^^^^^^^^^^
>  8 |     // The ref should still be mutable here even though function deps are frozen in
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  9 |     // @enablePreserveExistingMemoizationGuarantees mode
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 10 |     ref.current.inner = event.target.value;
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 11 |   });
     | ^^^^ [ReactForget] InvalidReact: This value was manually memoized, but cannot be memoized under Forget because it may be mutated after it is memoized (7:11)

[ReactForget] InvalidReact: This value was manually memoized, but cannot be memoized under Forget because it may be mutated after it is memoized (7:11)
  12 |
  13 |   // The ref is modified later, extending its range and preventing memoization of onChange
  14 |   ref.current.inner = null;
```
          
      