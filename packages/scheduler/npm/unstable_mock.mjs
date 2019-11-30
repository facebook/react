import * as dev from './esm/scheduler-unstable_mock.development.mjs';
import * as prod from './esm/scheduler-unstable_mock.production.min.mjs';

const isProduction = process.env.NODE_ENV === 'production';
function select(key) {
  return isProduction ? prod[key] : dev[key]
}

export const unstable_flushAllWithoutAsserting = select('unstable_flushAllWithoutAsserting');
export const unstable_flushNumberOfYields = select('unstable_flushNumberOfYields');
export const unstable_flushExpired = select('unstable_flushExpired');
export const unstable_clearYields = select('unstable_clearYields');
export const unstable_flushUntilNextPaint = select('unstable_flushUntilNextPaint');
export const unstable_flushAll = select('unstable_flushAll');
export const unstable_yieldValue = select('unstable_yieldValue');
export const unstable_advanceTime = select('unstable_advanceTime');
