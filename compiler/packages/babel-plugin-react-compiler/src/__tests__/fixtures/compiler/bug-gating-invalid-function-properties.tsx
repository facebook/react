// @gating

/**
 * Fail: bug-gating-invalid-function-properties
 *   Unexpected error in Forget runner
 *   Component is not defined
 */
export default function Component() {
  return <></>;
}

Component.displayName = "some display name";

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  sequentialRenders: [],
};
