// @validateNoDynamicallyCreatedComponentsOrHooks
export function getInput(a) {
  const Wrapper = () => {
    const handleChange = () => {
      a.onChange();
    };

    return <input onChange={handleChange} />;
  };

  return Wrapper;
}

export const FIXTURE_ENTRYPOINT = {
  fn: getInput,
  isComponent: false,
  params: [{onChange() {}}],
};
