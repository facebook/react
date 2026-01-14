
## Input

```javascript
import {useRef} from 'react';
import {addOne} from 'shared-runtime';

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

```


## Error

```
Found 1 error:

Error: Mutating refs during render is not allowed

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

error.capture-ref-for-mutation.ts:9:4
   7 |     const position = currentPosition.current;
   8 |     const nextPosition = direction === 'left' ? addOne(position) : position;
>  9 |     currentPosition.current = nextPosition;
     |     ^^^^^^^^^^^^^^^ Cannot mutate ref during render
  10 |   };
  11 |   const moveLeft = {
  12 |     handler: handleKey('left')(),

Refs may be mutated during render if initialized with `if (ref.current == null)`
```
          
      