// @validatePreserveExistingMemoizationGuarantees

import {useState} from 'react';

// Object mixing method shorthand and function expression properties
// should memoize entire object as a unit when deps change
function useMixed() {
  const [state, setState] = useState(0);
  return {
    // method shorthand
    getValue() {
      return state;
    },
    // arrow function property
    getValueArrow: () => state,
    // named function expression property
    getValueFn: function getValueFn() {
      return state;
    },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: useMixed,
  params: [{}],
};
