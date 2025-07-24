function Component() {
  const value = useMemo(() => {
    return; // empty return is valid (returns undefined)
  }, []);
  return <div>{value}</div>;
}