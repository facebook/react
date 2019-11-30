import * as dev from './esm/scheduler-tracing.development.mjs';
import * as prod from './esm/scheduler-tracing.production.min.mjs';

const isProduction = process.env.NODE_ENV === 'production';
function select(key) {
  return isProduction ? prod[key] : dev[key]
}

export const __interactionsRef = select('__interactionsRef');
export const __subscriberRef = select('__subscriberRef');
export const unstable_clear = select('unstable_clear');
export const unstable_getCurrent = select('unstable_getCurrent');
export const unstable_getThreadID = select('unstable_getThreadID');
export const unstable_subscribe = select('unstable_subscribe');
export const unstable_trace = select('unstable_trace');
export const unstable_unsubscribe = select('unstable_unsubscribe');
export const unstable_wrap = select('unstable_wrap');

