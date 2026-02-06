// @enableNonReactiveAnnotation @enableUseTypeAnnotations
type NonReactive<T> = T;

function Component({
  onSubmit,
  value,
}: {
  onSubmit: NonReactive<(data: string) => void>;
  value: string;
}) {
  return <button onClick={() => onSubmit(value)}>{value}</button>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{onSubmit: (data: string) => console.log(data), value: 'hello'}],
};
