// @enableNonReactiveAnnotation @enableUseTypeAnnotations
import {useRef} from 'react';

type NonReactive<T> = T;

function Component() {
  const ref = useRef<HTMLInputElement>(null);

  const handler: NonReactive<() => void> = () => {
    if (ref.current !== null) {
      console.log(ref.current.value);
    }
  };

  return (
    <>
      <input ref={ref} />
      <button onClick={handler}>Read Input</button>
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
