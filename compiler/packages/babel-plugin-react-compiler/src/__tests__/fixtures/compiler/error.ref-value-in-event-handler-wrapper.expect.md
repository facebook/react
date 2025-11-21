
## Input

```javascript
// @enableInferEventHandlers
import {useRef} from 'react';

// Simulates a handler wrapper
function handleClick(value: any) {
  return () => {
    console.log(value);
  };
}

function Component() {
  const ref = useRef(null);

  // This should still error: passing ref.current directly to a wrapper
  // The ref value is accessed during render, not in the event handler
  return (
    <>
      <input ref={ref} />
      <button onClick={handleClick(ref.current)}>Click</button>
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```


## Error

```
Found 1 error:

Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

error.ref-value-in-event-handler-wrapper.ts:19:35
  17 |     <>
  18 |       <input ref={ref} />
> 19 |       <button onClick={handleClick(ref.current)}>Click</button>
     |                                    ^^^^^^^^^^^ Cannot access ref value during render
  20 |     </>
  21 |   );
  22 | }
```
          
      