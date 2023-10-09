
## Input

```javascript
// @disableAllMemoization true
function Component(props) {
  const [x, setX] = useState(() => initializeState(props));
  const onChange = useCallback((e) => {
    setX(e.target.value);
  });
  const object = { x, onChange };
  return useMemo(() => {
    const { x, onChange } = object;
    return <input value={x} onChange={onChange} />;
  }, [x]);
}

```

## Code

```javascript
// @disableAllMemoization true
function Component(props) {
  const [x, setX] = useState(() => initializeState(props));
  const onChange = (e) => {
    setX(e.target.value);
  };

  const object = { x, onChange };
  let t86;

  const { x: x_0, onChange: onChange_0 } = object;
  t86 = <input value={x_0} onChange={onChange_0} />;
  return t86;
}

```
      