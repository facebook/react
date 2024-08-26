// @validatePreserveExistingMemoizationGuarantees
function Component(props) {
  const data = useMemo(() => {
    return props?.items.edges?.nodes.map();
  }, [props.items?.edges?.nodes]);
  // const data = props?.item.edges?.nodes.map();
  return <Foo data={data} />;
}
