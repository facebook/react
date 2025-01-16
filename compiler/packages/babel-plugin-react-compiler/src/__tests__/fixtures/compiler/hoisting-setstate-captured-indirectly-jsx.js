// @validatePreserveExistingMemoizationGuarantees
function useFoo() {
  const onClick = response => {
    setState(DISABLED_FORM);
  };

  const [state, setState] = useState();
  const handleLogout = useCallback(() => {
    setState(DISABLED_FORM);
  }, [setState]);
  const getComponent = () => {
    return <ColumnItem onPress={() => handleLogout()} />;
  };

  // this `getComponent` call is now inferred to be mutating
  // setState
  return [getComponent(), onClick]; // pass onClick to avoid dce
}
