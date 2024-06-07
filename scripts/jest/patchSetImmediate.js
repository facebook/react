'use strict';

export function patchSetImmediate(Scheduler) {
  if (!Scheduler) {
    throw new Error(
      'setImmediate patch was used without providing a Scheduler implementation. If you are patching setImmediate you must provide a Scheduler.'
    );
  }

  global.setImmediate = cb => {
    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, cb);
  };
}
