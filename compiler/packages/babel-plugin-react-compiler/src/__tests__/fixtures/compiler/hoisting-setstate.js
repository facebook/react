import {useEffect, useState} from 'react';
import {Stringify} from 'shared-runtime';

function Foo() {
  /**
   * Previously, this lowered to
   * $1 = LoadContext capture setState
   * $2 = FunctionExpression deps=$1 context=setState
   *  [[ at this point, we freeze the `LoadContext setState` instruction, but it will never be referenced again ]]
   */
  useEffect(() => setState(2), []);

  /**
   * Special case: declare / reassign to hoisted const
   *
   * What about reassignment to `let`?
   *  -> makes sense to error with "reassignemnt" message (not mutation message)
   */
  const [state, setState] = useState(0);
  return <Stringify state={state} />;
}

/**
 * Here is another version
function Component() {
  const cb = useBar(() => foo(2));
  const foo = useFoo();
  return <Foo cb={cb} />;
}
 */
export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
  sequentialRenders: [{}, {}],
};
