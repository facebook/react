// @validatePreserveExistingMemoizationGuarantees

/**
 * Repro from https://github.com/facebook/react/issues/34262
 *
 * We incorrectly infer `value` as the dependency, but that is a local value within the useMemo.
 */
function useInputValue(input) {
  const object = React.useMemo(() => {
    const {value} = transform(input);
    return {value};
  }, [input]);
  return object;
}
