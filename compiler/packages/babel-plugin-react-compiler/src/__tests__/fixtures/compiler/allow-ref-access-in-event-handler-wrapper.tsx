// @enableInferEventHandlers
import {useRef} from 'react';

// Simulates react-hook-form's handleSubmit or similar event handler wrappers
function handleSubmit<T>(callback: (data: T) => void) {
  return (event: any) => {
    event.preventDefault();
    callback({} as T);
  };
}

function Component() {
  const ref = useRef<HTMLInputElement>(null);

  const onSubmit = (data: any) => {
    // This should be allowed: accessing ref.current in an event handler
    // that's wrapped by handleSubmit and passed to onSubmit prop
    if (ref.current !== null) {
      console.log(ref.current.value);
    }
  };

  return (
    <>
      <input ref={ref} />
      <form onSubmit={handleSubmit(onSubmit)}>
        <button type="submit">Submit</button>
      </form>
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
