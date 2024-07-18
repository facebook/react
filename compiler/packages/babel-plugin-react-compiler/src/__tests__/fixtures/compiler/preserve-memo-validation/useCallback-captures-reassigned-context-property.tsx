// @validatePreserveExistingMemoizationGuarantees
import {useCallback} from 'react';
import {Stringify} from 'shared-runtime';

function Foo(props) {
  let contextVar;
  if (props.cond) {
    contextVar = {val: 2};
  } else {
    contextVar = {};
  }

  const cb = useCallback(() => [contextVar.val], [contextVar.val]);

  return <Stringify cb={cb} shouldInvokeFns={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{cond: true}],
};
