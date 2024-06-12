import { arrayPush } from "shared-runtime";

/**
 * Evaluator error:
 *   Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) [2]
 *   [2]
 *   Forget:
 *   (kind: ok) [2]
 *   [2,2]
 */
function Foo(cond) {
  let x = null;
  if (cond) {
    x = [];
  } else {
  }
  // Here, x = phi(x$null, x$[]) does not receive the correct ValueKind
  arrayPush(x, 2);

  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ cond: true }],
  sequentialRenders: [{ cond: true }, { cond: true }],
};
