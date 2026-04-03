const Symbol = '<symbol>';
function Component({text}) {
  return <div>{Symbol + text}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{text: 'hello'}],
};
