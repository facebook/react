// @enableMergeConsecutiveScopes
function Component(id) {
  const bar = (() => {})();

  return (
    <>
      <Bar title={bar} />
      <Bar title={id ? true : false} />
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [null],
};
