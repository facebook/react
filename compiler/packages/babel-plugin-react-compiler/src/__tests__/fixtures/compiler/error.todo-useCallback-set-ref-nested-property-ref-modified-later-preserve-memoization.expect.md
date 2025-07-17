
## Input

```javascript
// @enablePreserveExistingMemoizationGuarantees @validateRefAccessDuringRender
import {useCallback, useRef} from 'react';

function Component(props) {
  const ref = useRef({inner: null});

  const onChange = useCallback(event => {
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
Found 1 error:

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.todo-useCallback-set-ref-nested-property-ref-modified-later-preserve-memoization.ts:14:2
  12 |
  13 |   // The ref is modified later, extending its range and preventing memoization of onChange
> 14 |   ref.current.inner = null;
     |   ^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  15 |
  16 |   return <input onChange={onChange} />;
  17 | }
```
          
      