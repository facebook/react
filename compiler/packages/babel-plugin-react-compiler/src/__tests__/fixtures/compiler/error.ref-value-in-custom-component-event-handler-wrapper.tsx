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
