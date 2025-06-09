
## Input

```javascript
// @enableFire @panicThreshold:"none"
import {useRef} from 'react';

function Component({props, bar}) {
  const foo = () => {
    console.log(props);
  };
  useEffect(() => {
    fire(foo(props));
    fire(foo());
    fire(bar());
  });

  const ref = useRef(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  ref.current = 'bad';
  return <button ref={ref} />;
}

```

## Code

```javascript
import { useFire } from "react/compiler-runtime"; // @enableFire @panicThreshold:"none"
import { useRef } from "react";

function Component(t0) {
  const { props, bar } = t0;
  const foo = () => {
    console.log(props);
  };
  const t1 = useFire(foo);
  const t2 = useFire(bar);

  useEffect(() => {
    t1(props);
    t1();
    t2();
  });

  const ref = useRef(null);

  ref.current = "bad";
  return <button ref={ref} />;
}

```
      
### Eval output
(kind: exception) Fixture not implemented