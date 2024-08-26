// @validatePreserveExistingMemoizationGuarantees
function Component(props) {
  const data = useMemo(() => {
    return props.items?.edges?.nodes ?? [];
  }, [props.items?.edges?.nodes]);
  return <Foo data={data} />;
}
