// @gating

/**
 * Fail: bug-gating-invalid-function-properties
 *   Unexpected error in Forget runner
 *   Component is not defined
 */
export default function Component() {
  return <></>;
}

export function Component2() {
  return <></>;
}

Component.displayName = "Component ONE";
Component2.displayName = "Component TWO";

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  sequentialRenders: [],
};
