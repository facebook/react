// @reactiveSourceIdentifiers:["reactiveSource"]
function reactiveSource() {
  console.log('reactiveSource');
}

function Component({prop}) {
  const value1 = reactiveSource();
  const value2 = reactiveSource(value);
  const value3 = prop > 0.5 ? reactiveSource() : null;
  return (
    <div>
      {value1}
      {value2}
      {value3}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{prop: 1}],
  isComponent: true,
};
