// @enableNonReactiveAnnotation @enableUseTypeAnnotations
function nonReactive<T>(value: T): T {
  return value;
}

function Component({value}: {value: string}) {
  const handler = nonReactive(() => {
    console.log(value);
  });
  return <button onClick={handler}>Click</button>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'hello'}],
};
