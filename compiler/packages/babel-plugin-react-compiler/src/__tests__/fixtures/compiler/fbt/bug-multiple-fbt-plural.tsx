import fbt from 'fbt';

/**
 * Forget + fbt inconsistency. Evaluator errors with the following
 *   Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) 1 rewrite to Rust · 2 months traveling
 *   Forget:
 *   (kind: ok) 1 rewrites to Rust · 2 months traveling
 */
function Foo({rewrites, months}) {
  return (
    <fbt desc="Test fbt description">
      <fbt:plural count={rewrites} name="number of rewrites" showCount="yes">
        rewrite
      </fbt:plural>
      to Rust ·
      <fbt:plural count={months} name="number of months" showCount="yes">
        month
      </fbt:plural>
      traveling
    </fbt>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{rewrites: 1, months: 2}],
};
