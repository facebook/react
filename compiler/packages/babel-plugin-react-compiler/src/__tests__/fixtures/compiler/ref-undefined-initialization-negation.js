import {useRef} from 'react';

function Component() {
  const ref = useRef(undefined);
  if (!ref.current) {
    ref.current = 'initialized';
  }
  return <div>Hello World</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
