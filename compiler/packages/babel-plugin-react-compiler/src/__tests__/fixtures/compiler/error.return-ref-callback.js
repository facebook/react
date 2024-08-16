// @flow @validateRefAccessDuringRender @validatePreserveExistingMemoizationGuarantees

component Foo() {
  const ref = useRef();

  const s = () => {
    return ref.current;
  };

  return s;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};
