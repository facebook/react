// @enableTreatRefLikeIdentifiersAsRefs @validatePreserveExistingMemoizationGuarantees
import {useRef, useCallback} from 'react';

function useCustomRef() {
  return useRef({click: () => {}});
}

function Foo() {
  const custom_ref = useCustomRef();

  const onClick = useCallback(() => {
    custom_ref.current?.click();
  }, [custom_ref]);

  return <button onClick={onClick} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
  isComponent: true,
};
