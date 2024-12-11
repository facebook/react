function Component() {
  const data = useData();
  const items = [];
  // NOTE: `i` is a context variable because it's reassigned and also referenced
  // within a closure, the `onClick` handler of each item
  for (let i = MIN; i <= MAX; i += INCREMENT) {
    items.push(<div key={i} onClick={() => data.set(i)} />);
  }
  return <>{items}</>;
}

const MIN = 0;
const MAX = 3;
const INCREMENT = 1;

function useData() {
  return new Map();
}

export const FIXTURE_ENTRYPOINT = {
  params: [],
  fn: Component,
};
