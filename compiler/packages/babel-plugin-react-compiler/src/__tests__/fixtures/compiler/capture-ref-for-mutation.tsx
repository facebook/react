import {useRef} from 'react';
import {addOne} from 'shared-runtime';

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses an impure value during render.
 */
function useKeyCommand() {
  const currentPosition = useRef(0);
  const handleKey = direction => () => {
    const position = currentPosition.current;
    const nextPosition = direction === 'left' ? addOne(position) : position;
    currentPosition.current = nextPosition;
  };
  const moveLeft = {
    handler: handleKey('left')(),
  };
  const moveRight = {
    handler: handleKey('right')(),
  };
  return [moveLeft, moveRight];
}

export const FIXTURE_ENTRYPOINT = {
  fn: useKeyCommand,
  params: [],
};
