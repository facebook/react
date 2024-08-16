
## Input

```javascript
// @enableReactiveScopesInHIR:false
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
    handler: handleKey('left'),
  };
  const moveRight = {
    handler: handleKey('right'),
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
  11 |   };
  12 |   const moveLeft = {
> 13 |     handler: handleKey('left'),
     |              ^^^^^^^^^ InvalidReact: This function accesses a ref value (the `current` property), which may not be accessed during render. (https://react.dev/reference/react/useRef) (13:13)

InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (13:13)

InvalidReact: This function accesses a ref value (the `current` property), which may not be accessed during render. (https://react.dev/reference/react/useRef) (16:16)

InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (16:16)
  14 |   };
  15 |   const moveRight = {
  16 |     handler: handleKey('right'),
```
          
      