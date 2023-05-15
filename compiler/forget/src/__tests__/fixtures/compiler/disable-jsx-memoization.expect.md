
## Input

```javascript
// @memoizeJsxElements false
function Component(props) {
  const [name, setName] = useState(null);
  const onChange = function (e) {
    setName(e.target.value);
  };
  return (
    <form>
      <input onChange={onChange} value={name} />
    </form>
  );
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @memoizeJsxElements false
function Component(props) {
  const $ = useMemoCache(2);
  const [name, setName] = useState(null);
  const c_0 = $[0] !== setName;
  let t0;
  if (c_0) {
    t0 = function (e) {
      setName(e.target.value);
    };
    $[0] = setName;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onChange = t0;
  return (
    <form>
      <input onChange={onChange} value={name} />
    </form>
  );
}

```
      