/**
 * Test case for GitHub issue #35481: Hydration error with multiline className
 *
 * When a className attribute contains literal newlines (from multiline strings),
 * the compiler should normalize whitespace to prevent hydration mismatches between
 * server and client rendering.
 *
 * Before fix: className="\n  flex..." would remain unchanged, causing mismatches
 * After fix: className=" flex..." (newlines normalized to single spaces)
 */
function Component() {
  return (
    <div
      className="
        flex min-h-screen items-center justify-center bg-zinc-50 font-sans
        dark:bg-black
      "
    >
      <span
        className="
          text-lg font-medium
        "
      >
        Hello World
      </span>
    </div>
  );
}

/**
 * Test with tabs in className - should also be normalized
 */
export function ComponentWithTabs() {
  return (
    <div className="flex	items-center	justify-center">
      Content
    </div>
  );
}

/**
 * Test that non-className attributes with newlines are preserved
 */
export function ComponentWithOtherAttrs() {
  return (
    <div
      data-testid="
        multiline-value
      "
      aria-label="
        accessible label
      "
    >
      Content
    </div>
  );
}

/**
 * Test with class attribute (lowercase, for SVG compatibility)
 */
export function SvgComponent() {
  return (
    <svg
      class="
        w-6 h-6
      "
    >
      <path d="M0 0h24v24H0z" />
    </svg>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
