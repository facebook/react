
## Input

```javascript
// @flow
component Example() {
  const fooRef = useRef();

  function updateStyles() {
    const foo = fooRef.current;
    if (barRef.current == null || foo == null) {
      return;
    }
    foo.style.height = '100px';
  }

  const barRef = useRef(null);

  const resizeRef = useResizeObserver(rect => {
    const {width} = rect;
    barRef.current = width;
  });

  useLayoutEffect(() => {
    const observer = new ResizeObserver(_ => {
      updateStyles();
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return <div ref={resizeRef} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Example() {
  const $ = _c(6);
  const fooRef = useRef();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function updateStyles() {
      const foo = fooRef.current;
      if (barRef.current == null || foo == null) {
        return;
      }

      foo.style.height = "100px";
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const updateStyles = t0;

  const barRef = useRef(null);
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = (rect) => {
      const { width } = rect;
      barRef.current = width;
    };
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const resizeRef = useResizeObserver(t1);
  let t2;
  let t3;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => {
      const observer = new ResizeObserver((_) => {
        updateStyles();
      });
      return () => {
        observer.disconnect();
      };
    };

    t3 = [];
    $[2] = t2;
    $[3] = t3;
  } else {
    t2 = $[2];
    t3 = $[3];
  }
  useLayoutEffect(t2, t3);
  let t4;
  if ($[4] !== resizeRef) {
    t4 = <div ref={resizeRef} />;
    $[4] = resizeRef;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  return t4;
}

```
      
### Eval output
(kind: exception) Fixture not implemented