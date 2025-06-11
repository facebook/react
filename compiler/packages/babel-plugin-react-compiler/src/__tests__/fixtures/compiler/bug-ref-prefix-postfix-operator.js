import {useRef} from 'react';

/**
 * The postfix increment operator should return the value before incrementing.
 * ```js
 * const id = modalId.current; // 0
 * modalId.current = modalId.current + 1; // 1
 * return id;
 * ```
 * The bug is that we currently increment the value before the expression is evaluated.
 * This bug does not trigger when the incremented value is a plain primitive.
 */
function useFoo() {
  const modalId = useRef(0);
  const showModal = () => {
    const id = modalId.current++;
    return id;
  };
  const showModal2 = () => {
    const id = ++modalId.current;
    return id;
  };
  return {modalId, showModal, showModal2};
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};
