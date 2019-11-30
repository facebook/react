import * as dev from './esm/scheduler.development.mjs';
import * as prod from './esm/scheduler.production.min.mjs';

const isProduction = process.env.NODE_ENV === 'production';
function select(key) {
  return isProduction ? prod[key] : dev[key]
}

export const unstable_IdlePriority = select('unstable_IdlePriority');
export const unstable_ImmediatePriority = select('unstable_ImmediatePriority');
export const unstable_LowPriority = select('unstable_LowPriority');
export const unstable_NormalPriority = select('unstable_NormalPriority');
export const unstable_Profiling = select('unstable_Profiling');
export const unstable_UserBlockingPriority = select('unstable_UserBlockingPriority');
export const unstable_cancelCallback = select('unstable_cancelCallback');
export const unstable_continueExecution = select('unstable_continueExecution');
export const unstable_forceFrameRate = select('unstable_forceFrameRate');
export const unstable_getCurrentPriorityLevel = select('unstable_getCurrentPriorityLevel');
export const unstable_getFirstCallbackNode = select('unstable_getFirstCallbackNode');
export const unstable_next = select('unstable_next');
export const unstable_now = select('unstable_now');
export const unstable_pauseExecution = select('unstable_pauseExecution');
export const unstable_requestPaint = select('unstable_requestPaint');
export const unstable_runWithPriority = select('unstable_runWithPriority');
export const unstable_scheduleCallback = select('unstable_scheduleCallback');
export const unstable_shouldYield = select('unstable_shouldYield');
export const unstable_wrapCallback = select('unstable_wrapCallback');

