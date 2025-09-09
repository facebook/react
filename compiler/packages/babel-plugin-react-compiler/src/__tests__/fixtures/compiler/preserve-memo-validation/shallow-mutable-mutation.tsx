function Component({...props}: {value: string}) {
  const obj = {};
  props.newProp = obj;
  obj.mutated = true;

  return <div>{props.value}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'test'}],
  isComponent: true,
};
