// @validateNoComponentOrHookFactories
export function getInput(a) {
  const Wrapper = () => {
    const handleChange = () => {
      a.onChange();
    };

    return (
      <input
        onChange={handleChange}
      />
    );
  };

  return Wrapper;
}