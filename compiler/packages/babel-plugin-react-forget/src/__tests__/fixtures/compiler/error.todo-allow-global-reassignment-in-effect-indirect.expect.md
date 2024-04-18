
## Input

```javascript
import { useEffect, useState } from "react";

let someGlobal = false;

function Component() {
  const [state, setState] = useState(someGlobal);

  const setGlobal = () => {
    // TODO: this should be allowed since setGlobal is only used in an effect
    someGlobal = true;
  };
  useEffect(() => {
    setGlobal();
  }, []);

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
   8 |   const setGlobal = () => {
   9 |     // TODO: this should be allowed since setGlobal is only used in an effect
> 10 |     someGlobal = true;
     |     ^^^^^^^^^^ InvalidReact: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render) (10:10)
  11 |   };
  12 |   useEffect(() => {
  13 |     setGlobal();
```
          
      