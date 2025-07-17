
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
Found 4 errors:

Error: This function accesses a ref value (the `current` property), which may not be accessed during render. (https://react.dev/reference/react/useRef)

error.capture-ref-for-mutation.ts:12:13
  10 |   };
  11 |   const moveLeft = {
> 12 |     handler: handleKey('left')(),
     |              ^^^^^^^^^^^^^^^^^ This function accesses a ref value (the `current` property), which may not be accessed during render. (https://react.dev/reference/react/useRef)
  13 |   };
  14 |   const moveRight = {
  15 |     handler: handleKey('right')(),

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.capture-ref-for-mutation.ts:12:13
  10 |   };
  11 |   const moveLeft = {
> 12 |     handler: handleKey('left')(),
     |              ^^^^^^^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  13 |   };
  14 |   const moveRight = {
  15 |     handler: handleKey('right')(),

Error: This function accesses a ref value (the `current` property), which may not be accessed during render. (https://react.dev/reference/react/useRef)

error.capture-ref-for-mutation.ts:15:13
  13 |   };
  14 |   const moveRight = {
> 15 |     handler: handleKey('right')(),
     |              ^^^^^^^^^^^^^^^^^^ This function accesses a ref value (the `current` property), which may not be accessed during render. (https://react.dev/reference/react/useRef)
  16 |   };
  17 |   return [moveLeft, moveRight];
  18 | }

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.capture-ref-for-mutation.ts:15:13
  13 |   };
  14 |   const moveRight = {
> 15 |     handler: handleKey('right')(),
     |              ^^^^^^^^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  16 |   };
  17 |   return [moveLeft, moveRight];
  18 | }
```
          
      