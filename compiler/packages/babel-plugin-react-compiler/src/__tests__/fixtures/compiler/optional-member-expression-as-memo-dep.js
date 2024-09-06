// @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies @enablePropagateDepsInHIR:false
function Component(props) {
  const data = useMemo(() => {
    return props?.items.edges?.nodes.map();
  }, [props?.items.edges?.nodes]);
  return <Foo data={data} />;
}
