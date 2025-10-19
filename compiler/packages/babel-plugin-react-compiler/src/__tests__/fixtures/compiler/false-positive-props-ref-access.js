// @compilationMode(infer)
// Regression test for https://github.com/facebook/react/issues/34775
// The compiler should NOT flag props.className as a ref access just because
// props also contains props.ref. Each property should be independently typed.

import {useCallback} from 'react';

function Child(props: {className: string, myRef: () => void}) {
  const internalRef = useCallback(() => {
    console.log('ref');
  }, []);

  return (
    <div>
      <div ref={internalRef} className={props.className} />
      <div ref={props.myRef} className={props.className} />
    </div>
  );
}

export function Parent() {
  const ref = useCallback(() => {
    console.log('ref');
  }, []);

  return <Child myRef={ref} className="foo" />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Parent,
  params: [],
};
