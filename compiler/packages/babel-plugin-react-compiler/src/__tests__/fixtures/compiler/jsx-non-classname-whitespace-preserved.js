/**
 * Test case to verify that non-className attributes preserve their whitespace.
 * Only className and class attributes should have whitespace normalized.
 *
 * @see https://github.com/facebook/react/issues/35481
 */
function Component() {
  return (
    <div
      data-testid="
        multiline-test-id
      "
      aria-label="
        accessible label with
        multiple lines
      "
      title="single line title"
    >
      Content
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
