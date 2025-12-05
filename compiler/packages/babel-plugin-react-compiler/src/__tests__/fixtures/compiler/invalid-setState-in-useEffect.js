// @validateNoSetStateInEffects
function Component() {
  useEffect(() => {
    setCount(count + 1); // should error
  }, []);

  const [count, setCount] = useState(0); // useState declared AFTER useEffect

  useEffect(() => {
    setCount(c => c + 1); // should error
  }, []);
}