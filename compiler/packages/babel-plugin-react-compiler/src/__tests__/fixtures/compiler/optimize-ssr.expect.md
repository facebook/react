
## Input

```javascript
// @enableOptimizeForSSR
function Component() {
  const [state, setState] = useState(0);
  const ref = useRef(null);
  const onChange = e => {
    setState(e.target.value);
  };
  useEffect(() => {
    log(ref.current.value);
  });
  return <input value={state} onChange={onChange} ref={ref} />;
}

```

## Code

```javascript
// @enableOptimizeForSSR
function Component() {
  const state = 0;
  return <input value={state} />;
}

```
      
### Eval output
(kind: exception) Fixture not implemented