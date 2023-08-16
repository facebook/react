
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

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @memoizeJsxElements false
function Component(props) {
  const $ = useMemoCache(1);
  const [name, setName] = useState(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function (e) {
      setName(e.target.value);
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const onChange = t0;
  return (
    <form>
      <input onChange={onChange} value={name} />
    </form>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      