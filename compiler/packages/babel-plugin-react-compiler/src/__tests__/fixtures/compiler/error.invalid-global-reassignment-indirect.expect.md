
## Input

```javascript
import {useEffect, useState} from 'react';

let someGlobal = false;

function Component() {
  const [state, setState] = useState(someGlobal);

  const setGlobal = () => {
    someGlobal = true;
  };
  const indirectSetGlobal = () => {
    setGlobal();
  };
  indirectSetGlobal();

  useEffect(() => {
    setState(someGlobal);
  }, [someGlobal]);

  return <div>{String(state)}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```


## Error

```
   7 |
   8 |   const setGlobal = () => {
>  9 |     someGlobal = true;
     |     ^^^^^^^^^^ InvalidReact: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render) (9:9)
  10 |   };
  11 |   const indirectSetGlobal = () => {
  12 |     setGlobal();
```
          
      