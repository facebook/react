
## Input

```javascript
import {
  useEffect,
  useRef,
  // @ts-expect-error
  experimental_useEffectEvent as useEffectEvent,
} from 'react';

let id = 0;
function uniqueId() {
  'use no memo';
  return id++;
}

export function useCustomHook(src: string): void {
  const uidRef = useRef(uniqueId());
  const destroyed = useRef(false);
  const getItem = (srcName, uid) => {
    return {srcName, uid};
  };

  const getItemEvent = useEffectEvent(() => {
    if (destroyed.current) return;

    getItem(src, uidRef.current);
  });

  useEffect(() => {
    destroyed.current = false;
    getItemEvent();
  }, []);
}

function Component() {
  useCustomHook('hello');
  return <div>Hello</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  isComponent: true,
  params: [{x: 1}],
};

```


## Error

```
  19 |   };
  20 |
> 21 |   const getItemEvent = useEffectEvent(() => {
     |                                       ^^^^^^^
> 22 |     if (destroyed.current) return;
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 23 |
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 24 |     getItem(src, uidRef.current);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 25 |   });
     | ^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (21:25)
  26 |
  27 |   useEffect(() => {
  28 |     destroyed.current = false;
```
          
      