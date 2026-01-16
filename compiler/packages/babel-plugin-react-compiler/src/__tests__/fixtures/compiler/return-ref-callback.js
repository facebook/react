// @flow @validateRefAccessDuringRender @validatePreserveExistingMemoizationGuarantees

import {useRef} from 'react';

hook useFoo() {
  const ref = useRef();

  const s = () => {
    return ref.current;
  };

  return s;
}

component Foo() {
  useFoo();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};
