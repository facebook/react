// @enableStableHandlerAnnotation @enableUseTypeAnnotations
type StableHandler<T> = T;

function Component({value}: {value: string}) {
  const handler: StableHandler<() => void> = () => {
    console.log(value);
  };
  return <button onClick={handler}>Click</button>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'hello'}],
};
