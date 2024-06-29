// @validateMemoizedEffectDependencies
function Component(props) {
  // Items cannot be memoized bc its mutation spans a hook call
  const items = [props.value];
  const [state, _setState] = useState(null);
  mutate(items);

  // Items is no longer mutable here, but it hasn't been memoized
  useEffect(() => {
    console.log(items);
  }, [items]);

  return [items, state];
}
