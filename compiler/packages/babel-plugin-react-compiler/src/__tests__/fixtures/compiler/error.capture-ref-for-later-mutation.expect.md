
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
  10 |   };
  11 |   const moveLeft = {
> 12 |     handler: handleKey('left'),
     |              ^^^^^^^^^ InvalidReact: This function accesses a ref value (the `current` property), which may not be accessed during render. (https://react.dev/reference/react/useRef) (12:12)

InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (12:12)

InvalidReact: This function accesses a ref value (the `current` property), which may not be accessed during render. (https://react.dev/reference/react/useRef) (15:15)

InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (15:15)
  13 |   };
  14 |   const moveRight = {
  15 |     handler: handleKey('right'),
```
          
      