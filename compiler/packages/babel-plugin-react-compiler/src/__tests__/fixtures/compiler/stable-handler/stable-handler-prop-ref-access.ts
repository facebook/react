// @enableStableHandlerAnnotation @enableUseTypeAnnotations
import {useRef} from 'react';

type StableHandler<T> = T;

function Component({
  onSubmit,
}: {
  onSubmit: StableHandler<(data: string) => void>;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const handler = () => {
    onSubmit(ref.current!.value);
  };
  return (
    <>
      <input ref={ref} />
      <button onClick={handler}>Submit</button>
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{onSubmit: (data: string) => console.log(data)}],
};
