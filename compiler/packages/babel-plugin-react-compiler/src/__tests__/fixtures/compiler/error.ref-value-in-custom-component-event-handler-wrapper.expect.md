
## Input

```javascript
// @enableInferEventHandlers
import {useRef} from 'react';

// Simulates a custom component wrapper
function CustomForm({onSubmit, children}: any) {
  return <form onSubmit={onSubmit}>{children}</form>;
}

// Simulates react-hook-form's handleSubmit
function handleSubmit<T>(callback: (data: T) => void) {
  return (event: any) => {
    event.preventDefault();
    callback({} as T);
  };
}

function Component() {
  const ref = useRef<HTMLInputElement>(null);

  const onSubmit = (data: any) => {
    // This should error: passing function with ref access to custom component
    // event handler, even though it would be safe on a native <form>
    if (ref.current !== null) {
      console.log(ref.current.value);
    }
  };

  return (
    <>
      <input ref={ref} />
      <CustomForm onSubmit={handleSubmit(onSubmit)}>
        <button type="submit">Submit</button>
      </CustomForm>
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

error.ref-value-in-custom-component-event-handler-wrapper.ts:31:41
  29 |     <>
  30 |       <input ref={ref} />
> 31 |       <CustomForm onSubmit={handleSubmit(onSubmit)}>
     |                                          ^^^^^^^^ Passing a ref to a function may read its value during render
  32 |         <button type="submit">Submit</button>
  33 |       </CustomForm>
  34 |     </>
```
          
      