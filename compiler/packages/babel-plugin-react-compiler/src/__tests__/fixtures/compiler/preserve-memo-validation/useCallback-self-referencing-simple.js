// @validatePreserveExistingMemoizationGuarantees @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
import {useCallback, useRef} from 'react';

function Component() {
  const countRef = useRef(0);

  // Self-referencing callback with empty deps - recursiveIncrement references itself
  // This pattern is valid and should not trigger a memoization error
  const recursiveIncrement = useCallback(() => {
    countRef.current = countRef.current + 1;
    console.log('Count:', countRef.current);
    if (countRef.current < 10) {
      setTimeout(recursiveIncrement, 1000);
    }
  }, []);

  return (
    <div>
      <button onClick={recursiveIncrement}>Start counting</button>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};
