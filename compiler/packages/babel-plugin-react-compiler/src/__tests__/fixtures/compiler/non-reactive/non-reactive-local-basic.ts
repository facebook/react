// @enableNonReactiveAnnotation @enableUseTypeAnnotations
type NonReactive<T> = T;

function Component({value}: {value: string}) {
  const handler: NonReactive<() => void> = () => {
    console.log(value);
  };
  return <button onClick={handler}>Click</button>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'hello'}],
};
