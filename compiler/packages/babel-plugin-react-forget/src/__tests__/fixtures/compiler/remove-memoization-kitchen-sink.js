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
