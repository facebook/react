// @validatePreserveExistingMemoizationGuarantees
import {useCallback, useRef} from 'react';

function Component() {
  let object = {};
  const cb = () => object; // maybeFreeze object
  object = 2;
  useFoo(cb);
  return [object, cb];
}
