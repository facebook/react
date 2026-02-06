// @enableNonReactiveAnnotation @enableUseTypeAnnotations
type NonReactive<T> = T;

function Component({
  onSubmit,
  label,
}: {
  onSubmit: NonReactive<(data: string) => void>;
  label: string;
}) {
  return (
    <button onClick={() => onSubmit(label)}>
      {label}
    </button>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{onSubmit: (data: string) => console.log(data), label: 'click me'}],
};
