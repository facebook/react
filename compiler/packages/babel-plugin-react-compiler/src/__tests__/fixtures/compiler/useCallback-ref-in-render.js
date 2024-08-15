// @flow @validateRefAccessDuringRender @validatePreserveExistingMemoizationGuarantees

component Foo() {
  const ref = useRef();

  const s = useCallback(() => {
    return ref.current;
  });

  return <a r={s} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};
