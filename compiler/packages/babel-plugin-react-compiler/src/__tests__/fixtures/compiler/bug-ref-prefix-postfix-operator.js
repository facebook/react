import {useRef} from 'react';

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
