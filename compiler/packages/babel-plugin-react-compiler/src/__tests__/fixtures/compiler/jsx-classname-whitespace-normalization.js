/**
 * Test case for className whitespace normalization.
 * Verifies that newlines and tabs in className are normalized to spaces.
 *
 * @see https://github.com/facebook/react/issues/35481
 */
function Component() {
  // Single newline
  const a = <div className="flex
items-center" />;

  // Multiple newlines
  const b = <div className="flex


justify-center" />;

  // Tabs
  const c = <div className="flex	items-center	justify-center" />;

  // Mixed whitespace
  const d = <div className="
    flex
    items-center
  " />;

  return (
    <>
      {a}
      {b}
      {c}
      {d}
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
