
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
[ReactForget] InvalidReact: This value was manually memoized, but cannot be memoized under Forget because it may be mutated after it is memoized (7:11)

[ReactForget] InvalidReact: This value was manually memoized, but cannot be memoized under Forget because it may be mutated after it is memoized (7:11)
```
          
      